/**
 * 前后端之间的极简流式协议。
 *
 * 为什么不用 AI SDK 的 data-stream 协议：我们只需要「一段流式正文 + 一小段结尾元数据」，
 * 自定义一个分隔符最简单，客户端用原生 fetch + ReadableStream 就能解析，
 * 而且即使元数据没送到，正文依然可读（优雅降级）。
 *
 * 响应体形如：
 *   正文逐字流式输出……
 *   \n<<<INFENT_META>>>{"strategyIds":["stead-grow"],"sources":["预注册证伪流程"]}
 */

import type { ToolTrace } from './tools'
import type { StrategySelection } from './structured'

export const META_DELIMITER = '\n<<<INFENT_META>>>'

export type ChatMeta = {
  /** 服务端确定性匹配出的策略卡 id，对应 lib/mock/agent.ts 的 STRATEGIES */
  strategyIds: string[]
  /** 本次回答检索到的知识库来源文档名，用于前端标注引用 */
  sources: string[]
  /** 是否运行在无模型 key 的降级模式 */
  degraded?: boolean
  refused?: boolean
  tools?: ToolTrace[]
  strategyMode?: StrategySelection['mode']
  strategyCards?: StrategySelection['cards']
}

export function encodeMeta(meta: ChatMeta): string {
  return META_DELIMITER + JSON.stringify(meta)
}

/** 从完整响应文本里切出正文与元数据。元数据缺失时返回空 meta。 */
export function splitMeta(raw: string): { text: string; meta: ChatMeta | null } {
  const i = raw.indexOf(META_DELIMITER)
  if (i === -1) {
    // Do not flash a partially received metadata delimiter in the chat bubble.
    for (let n = Math.min(raw.length, META_DELIMITER.length - 1); n > 0; n--) {
      if (raw.endsWith(META_DELIMITER.slice(0, n))) return { text: raw.slice(0, -n), meta: null }
    }
    return { text: raw, meta: null }
  }
  const text = raw.slice(0, i)
  const jsonPart = raw.slice(i + META_DELIMITER.length).trim()
  try {
    const meta = JSON.parse(jsonPart)
    if (!Array.isArray(meta.strategyIds) || !meta.strategyIds.every((v: unknown) => typeof v === 'string') ||
        !Array.isArray(meta.sources) || !meta.sources.every((v: unknown) => typeof v === 'string')) return { text, meta: null }
    return { text, meta: meta as ChatMeta }
  } catch {
    return { text, meta: null }
  }
}
