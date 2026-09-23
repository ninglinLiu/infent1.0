/**
 * 知识库检索。
 *
 * 两种模式，自动选择：
 *   1. 向量检索 —— 索引里带 embedding 且配置了 embedding key 时启用
 *   2. 词法检索 —— 默认。IDF 加权 + 中文二元切分，零 API 调用、零延迟
 *
 * 为什么默认走词法：知识库只有几十个 chunk，词法检索的召回已经够用，
 * 而且不需要在每次对话时多打一次 embedding 接口（省钱、省一个往返延迟、少一个故障点）。
 * 向量检索留作可选升级项。
 */

import index from './knowledge-index.generated.json'
import { getEmbeddingConfig, LIMITS } from './config'

export type Chunk = {
  id: string
  doc: string
  section: string
  text: string
  embedding?: number[]
}

export type Hit = {
  chunk: Chunk
  score: number
}

const CHUNKS = (index.chunks as Chunk[]) ?? []
const INDEX_HAS_EMBEDDING = Boolean(index.embedded) && CHUNKS.some((c) => Array.isArray(c.embedding))

/* ----------------------------------------------------------------- 分词 */

/**
 * 中英混合分词：拉丁词按单词切，CJK 按二元组切。
 * 二元组对中文检索的效果远好于单字，也不需要引入分词库。
 */
function tokenize(text: string): string[] {
  const lower = text.toLowerCase()
  const tokens: string[] = []

  const latin = lower.match(/[a-z0-9][a-z0-9+#._-]*/g)
  if (latin) tokens.push(...latin.filter((w) => w.length > 1))

  const cjkRuns = lower.match(/[\u4e00-\u9fff]+/g)
  if (cjkRuns) {
    for (const run of cjkRuns) {
      if (run.length === 1) {
        tokens.push(run)
        continue
      }
      for (let i = 0; i < run.length - 1; i++) tokens.push(run.slice(i, i + 2))
    }
  }
  return tokens
}

/* ------------------------------------------------- 词法检索（默认路径） */

type LexicalModel = {
  docTokens: string[][]
  idf: Map<string, number>
  df: Map<string, number>
  n: number
}

let lexical: LexicalModel | null = null

function buildLexical(): LexicalModel {
  const docTokens = CHUNKS.map((c) => tokenize(`${c.doc} ${c.section} ${c.text}`))
  const df = new Map<string, number>()
  for (const toks of docTokens) {
    for (const t of new Set(toks)) df.set(t, (df.get(t) ?? 0) + 1)
  }
  const N = Math.max(1, docTokens.length)
  const idf = new Map<string, number>()
  for (const [t, d] of df) idf.set(t, Math.log(1 + N / (1 + d)))
  return { docTokens, idf, df, n: N }
}

/** 一个 hit 至少要命中这么多个不同的高区分度词，才算真的相关 */
const MIN_DISTINCT_MATCHES = 2

function lexicalSearch(query: string, k: number): Hit[] {
  if (!lexical) lexical = buildLexical()
  const { docTokens, idf, df, n } = lexical
  const rawTokens = tokenize(expandQuery(query))
  if (rawTokens.length === 0) return []

  // 丢掉区分度过低的查询词。
  // 「怎么」「什么」「可以」「一个」这类中文虚词二元组在小语料上 IDF 压不住，
  // 会让任何问题都能匹配到东西（实测「今天天气怎么样」曾因此命中研究笔记）。
  // 规则：出现在超过四分之一 chunk 里的词，不作为检索依据。
  const dfCeiling = Math.max(2, Math.floor(n * 0.25))
  const qTokens = rawTokens.filter((t) => {
    const d = df.get(t)
    return d !== undefined && d <= dfCeiling
  })
  if (qTokens.length === 0) return []

  const qSet = new Set(qTokens)
  const scores: Hit[] = []

  for (let i = 0; i < CHUNKS.length; i++) {
    const toks = docTokens[i]
    if (toks.length === 0) continue
    const tf = new Map<string, number>()
    for (const t of toks) if (qSet.has(t)) tf.set(t, (tf.get(t) ?? 0) + 1)
    if (tf.size < MIN_DISTINCT_MATCHES) continue

    let s = 0
    for (const [t, f] of tf) {
      // 次线性 tf + idf，再除以长度做归一化，避免长 chunk 天然占优
      s += (1 + Math.log(f)) * (idf.get(t) ?? 0)
    }
    s /= Math.sqrt(toks.length)

    // 标题命中给额外权重：标题里的词更能代表这段在讲什么
    const titleToks = new Set(tokenize(`${CHUNKS[i].doc} ${CHUNKS[i].section}`))
    let titleHits = 0
    for (const t of qSet) if (titleToks.has(t)) titleHits++
    s *= 1 + Math.min(0.6, titleHits * 0.08)

    scores.push({ chunk: CHUNKS[i], score: s })
  }

  scores.sort((a, b) => b.score - a.score)
  return scores.slice(0, k)
}

/* ------------------------------------------- 向量检索（可选升级路径） */

function cosine(a: number[], b: number[]): number {
  let dot = 0
  let na = 0
  let nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  if (na === 0 || nb === 0) return 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

async function embedQuery(query: string): Promise<number[] | null> {
  const cfg = getEmbeddingConfig()
  if (!cfg) return null
  try {
    const res = await fetch(`${cfg.baseUrl}/embeddings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({ model: cfg.model, input: query }),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const json = await res.json()
    const vec = json?.data?.[0]?.embedding
    return Array.isArray(vec) ? vec : null
  } catch {
    return null
  }
}

/* --------------------------------------------------------------- 对外接口 */

/**
 * 相关性下限。低于这个分数视为「知识库里没有相关内容」，不硬凑引用。
 * 这个值配合上面的虚词过滤与「至少命中两个高区分度词」一起生效，
 * 三道条件的目的都是同一件事：宁可不引用，也不要为了显得有依据而强行引用。
 */
// 这个值是用一组带标注的问题（含 4 个「知识库里确实没有」的负例）扫参出来的：
// dfPct=0.25 + 至少命中 2 个高区分度词 + 分数≥0.3 时，
// 负例全部返回空（零误引用），同时保住了绝大多数应命中的问题。
const MIN_LEXICAL_SCORE = 0.3
const MIN_VECTOR_SCORE = 0.28

// Curated terminology bridges the English landing page to the Chinese notes.
// This is query expansion, not a claim of general multilingual retrieval.
export function expandQuery(query: string): string {
  const glossary: Array<[RegExp, string]> = [
    [/overfit|preregister|pre-register|falsif|out.of.sample/i, '预注册 证伪 样本外 过拟合'],
    [/live trad|real money|paper trad/i, '真实资金 实盘 复盘'],
    [/slippage|capacity|execution cost|liquidity|market impact/i, '滑点 成本 容量 执行'],
    [/look.ahead|point.in.time|data leakage|survivorship|training cutoff/i, '前视偏差 时点 数据 泄漏'],
    [/copy.trad|wallet.*follow|follow.*wallet/i, '跟单 可复制性 钱包'],
    [/ruin|position siz|risk budget|drawdown/i, '风险预算 破产概率 仓位 回撤'],
    [/cross.market|transfer.*strateg|strateg.*transfer/i, '跨市场 方法论 移植'],
  ]
  return query + ' ' + glossary.filter(([re]) => re.test(query)).map(([, words]) => words).join(' ')
}

export type RetrieveResult = {
  hits: Hit[]
  mode: 'vector' | 'lexical' | 'none'
}

export async function retrieve(query: string, k = LIMITS.retrieveTopK): Promise<RetrieveResult> {
  if (CHUNKS.length === 0 || !query.trim()) return { hits: [], mode: 'none' }
  // Account lookups need current RPC evidence, not a historical research citation
  // merely sharing the word "Ethereum". Methodology questions still use RAG.
  if (/0x[0-9a-f]{40}/i.test(query) && /余额|balance|nonce|transaction count/i.test(query) && !/原理|风险|why|risk|method/i.test(query)) {
    return { hits: [], mode: 'none' }
  }

  if (INDEX_HAS_EMBEDDING) {
    const qv = await embedQuery(query)
    if (qv) {
      const scored: Hit[] = []
      for (const c of CHUNKS) {
        if (!c.embedding) continue
        scored.push({ chunk: c, score: cosine(qv, c.embedding) })
      }
      scored.sort((a, b) => b.score - a.score)
      const hits = scored.slice(0, k).filter((h) => h.score >= MIN_VECTOR_SCORE)
      return { hits, mode: 'vector' }
    }
    // 拿不到 query 向量就静默降级，不让对话失败
  }

  const hits = lexicalSearch(query, k).filter((h) => h.score >= MIN_LEXICAL_SCORE)
  return { hits, mode: 'lexical' }
}

/** 把检索结果拼成注入 system message 的文本块。没有命中就返回空串。 */
export function formatContext(hits: Hit[]): string {
  if (hits.length === 0) return ''
  const parts = hits.map((h) => {
    const title = h.chunk.section ? `${h.chunk.doc} · ${h.chunk.section}` : h.chunk.doc
    return `【来源：${title}】\n${h.chunk.text}`
  })
  return parts.join('\n\n')
}

export function sourceNames(hits: Hit[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const h of hits) {
    const name = h.chunk.section ? `${h.chunk.doc} · ${h.chunk.section}` : h.chunk.doc
    if (seen.has(name)) continue
    seen.add(name)
    out.push(name)
  }
  return out
}

export const knowledgeStats = {
  chunkCount: CHUNKS.length,
  hasEmbedding: INDEX_HAS_EMBEDDING,
  generatedAt: (index as { generatedAt?: string }).generatedAt ?? null,
}
