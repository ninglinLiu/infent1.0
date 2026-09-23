/**
 * 模型与检索的配置集中处。
 *
 * 设计取舍：这里不依赖任何 AI SDK，只用 OpenAI 兼容的 HTTP 接口。
 * 好处是零新增运行时依赖、无版本漂移，并且换 provider 只需要改环境变量
 * （DeepSeek / Moonshot / 智谱 / OpenAI 都是 OpenAI 兼容协议）。
 *
 * 所有密钥只在服务端读取。禁止给任何 key 加 NEXT_PUBLIC_ 前缀。
 */

export type ChatProviderConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

export type EmbeddingProviderConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

/** 对话模型。缺 key 时返回 null，由调用方降级处理。 */
export function getChatConfig(): ChatProviderConfig | null {
  const apiKey =
    process.env.LLM_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OPENAI_API_KEY ||
    ''
  if (!apiKey) return null

  return {
    baseUrl: (process.env.LLM_BASE_URL || 'https://api.deepseek.com/v1').replace(/\/+$/, ''),
    apiKey,
    // Providers differ in tools/JSON/reasoning support. Verify a new model with
    // test:live before deploying it; reasoning-only responses are treated as errors.
    model: process.env.LLM_MODEL || 'deepseek-chat',
  }
}

/** 推理模型需要大得多的 token 预算，这里允许用环境变量覆盖。 */
export function getMaxOutputTokens(): number {
  const raw = Number(process.env.LLM_MAX_TOKENS)
  if (Number.isFinite(raw) && raw >= 128 && raw <= 32000) return Math.floor(raw)
  return LIMITS.maxOutputTokens
}

/** 上游请求超时。没有超时的话，provider 卡住会让请求一直挂着。 */
export function getRequestTimeoutMs(): number {
  const raw = Number(process.env.LLM_TIMEOUT_MS)
  if (Number.isFinite(raw) && raw >= 5000 && raw <= 110000) return Math.floor(raw)
  return 60_000
}

/** Embedding 模型（仅 scripts/build-knowledge.mjs 需要，可选）。 */
export function getEmbeddingConfig(): EmbeddingProviderConfig | null {
  const apiKey = process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY || ''
  if (!apiKey) return null
  return {
    baseUrl: (process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    apiKey,
    model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  }
}

/** 单次请求的上限，防滥用。 */
export const LIMITS = {
  maxMessages: 24,
  maxCharsPerMessage: 4000,
  maxOutputTokens: 1200,
  retrieveTopK: 4,
  /** 同一 IP 的滑动窗口限流 */
  rateWindowMs: 60_000,
  rateMaxRequests: 12,
} as const
