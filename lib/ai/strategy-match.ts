/**
 * 策略卡的选择。
 *
 * 设计取舍：**不让模型决定推哪张卡**，而是在服务端做确定性匹配。
 *
 * 理由：策略推荐需要可解释、可复现。如果由模型自由选择，同一个问题两次问会推不同的卡，
 * 而且无法解释为什么。确定性匹配的规则是可以写进文档、可以被审计的。
 * 模型只负责解释与教育，不负责选品。
 *
 * 匹配依据是 lib/mock/agent.ts 里每个策略自带的 tags / thesis / name，
 * 复用了原有数据结构，不需要额外维护一张映射表。
 */

import { STRATEGIES, QUICK_QUESTIONS, type Strategy } from '@/lib/mock/agent'

/** 问题里出现这些词时，倾向对应的风险等级 */
const RISK_HINTS: Array<{ re: RegExp; maxRisk: number }> = [
  { re: /新手|没经验|第一次|怕亏|稳健|保守|低风险|beginner|conservative|safe|low risk/i, maxRisk: 2 },
  { re: /激进|博|搏|翻倍|高收益|aggressive|moonshot|10x/i, maxRisk: 5 },
]

/** 主题关键词 → 策略 id 的软映射，作为标签匹配之外的补充 */
const TOPIC_HINTS: Array<{ re: RegExp; ids: string[] }> = [
  { re: /通胀|物价|贬值|存款|理财|inflation|savings|deposit/i, ids: ['inflation-hedge'] },
  { re: /降息|加息|利率|美联储|fed|rate cut|interest rate/i, ids: ['stead-grow'] },
  { re: /月薪|工资|每月|定投|起步|入门|salary|monthly|dca|start/i, ids: ['salary-5k'] },
  { re: /一年|1\s*年|短期|跑赢|闲钱|one year|1y|beat/i, ids: ['100k-1y'] },
  { re: /腾讯|港股|加仓|减仓|备兑|tencent|hong kong|covered call/i, ids: ['tencent-position'] },
  { re: /新能源|光伏|锂|电车|反弹|抄底|new energy|ev|rebound|dip/i, ids: ['new-energy'] },
]

const LATIN_ONLY = /^[a-z0-9+#._-]+$/

/**
 * 判断 needle 是否出现在 query 里。
 *
 * 拉丁词必须整词匹配且长度 ≥ 4：否则像 "in" 这种短词会命中 "ruin"、
 * 导致「How should I size positions to avoid ruin?」误配到腾讯备兑策略（实测踩到过）。
 * 中文用子串匹配，但要求长度 ≥ 2。
 */
function tokenHit(query: string, needle: string): boolean {
  const n = needle.toLowerCase().trim()
  if (n.length < 2) return false

  if (LATIN_ONLY.test(n)) {
    if (n.length < 4) return false
    return new RegExp(`(^|[^a-z0-9])${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(query)
  }
  return query.includes(n)
}

function scoreStrategy(s: Strategy, q: string): number {
  const query = q.toLowerCase()
  let score = 0

  for (const tag of [...s.tags, ...s.tagsEn]) {
    if (tokenHit(query, tag)) score += 2
  }
  for (const word of [s.name, s.nameEn, s.thesis, s.thesisEn]) {
    const parts = word
      .toLowerCase()
      .split(/[\s·,，、。：:+/（）()]+/)
      .filter((w) => w.length >= 2)
    for (const p of parts) {
      if (tokenHit(query, p)) score += 0.5
    }
  }
  return score
}

/**
 * 返回最多两个教学候选策略 id；没有相关候选时返回空数组。
 * 模型只能在这些候选中选卡，结构化输出失败时原样使用候选。
 */
export function matchStrategies(question: string, max = 2): string[] {
  const q = (question || '').trim()
  if (!q) return []

  // 1. 先看是否命中原有的快捷问题，命中则直接用它预设的策略
  const exact = QUICK_QUESTIONS.find(
    (x) => x.prompt === q || x.promptEn === q || x.label === q || x.labelEn === q
  )
  if (exact && exact.strategyIds.length > 0) return exact.strategyIds.slice(0, max)

  const scores = new Map<string, number>()
  for (const id of Object.keys(STRATEGIES)) {
    scores.set(id, scoreStrategy(STRATEGIES[id], q))
  }

  // 2. 主题关键词加权
  for (const hint of TOPIC_HINTS) {
    if (!hint.re.test(q)) continue
    for (const id of hint.ids) scores.set(id, (scores.get(id) ?? 0) + 3)
  }

  // 3. 风险偏好过滤
  let maxRisk = 5
  for (const h of RISK_HINTS) {
    if (h.re.test(q)) maxRisk = Math.min(maxRisk, h.maxRisk)
  }

  const ranked = Object.keys(STRATEGIES)
    .filter((id) => STRATEGIES[id].risk <= maxRisk)
    .map((id) => ({ id, score: scores.get(id) ?? 0 }))
    .sort((a, b) => b.score - a.score)

  const picked = ranked.filter((r) => r.score > 0).slice(0, max).map((r) => r.id)
  if (picked.length > 0) return picked

  return []
}
