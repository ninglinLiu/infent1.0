import type { ChatProviderConfig } from './config'

export type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } }
export type ModelMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string | null
  tool_calls?: ToolCall[]
  tool_call_id?: string
}
export type ProviderOptions = { config: ChatProviderConfig; signal: AbortSignal; fetcher?: typeof fetch }

export async function completion(body: Record<string, unknown>, options: ProviderOptions): Promise<Response> {
  const response = await (options.fetcher ?? fetch)(`${options.config.baseUrl}/chat/completions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${options.config.apiKey}` },
    body: JSON.stringify({ model: options.config.model, ...body }), signal: options.signal,
  })
  if (!response.ok || !response.body) {
    await response.body?.cancel()
    throw new Error(`Model provider HTTP ${response.status}`)
  }
  return response
}

/** Parse events across byte boundaries, including a final line without a newline. */
export async function readCompletionStream(response: Response, onText: (delta: string) => void) {
  if (!response.body) throw new Error('Missing response body')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  const calls = new Map<number, ToolCall>()
  let buffer = '', content = '', sawReasoning = false, finished = false
  const line = (raw: string) => {
    if (!raw.trimStart().startsWith('data:')) return
    const data = raw.trim().slice(5).trim()
    if (!data) return
    if (data === '[DONE]') { finished = true; return }
    const event = JSON.parse(data)
    if (event.error) throw new Error('Provider stream error')
    const choice = event.choices?.[0]
    const delta = choice?.delta ?? {}
    if (delta.reasoning_content) sawReasoning = true
    if (typeof delta.content === 'string') {
      content += delta.content
      if (content.length > 100_000) throw new Error('Provider output limit')
      onText(delta.content)
    }
    for (const patch of delta.tool_calls ?? []) {
      if (!Number.isInteger(patch.index) || patch.index < 0 || patch.index >= 6) throw new Error('Invalid tool index')
      const call = calls.get(patch.index) ?? { id: '', type: 'function', function: { name: '', arguments: '' } }
      if (patch.id) call.id += patch.id
      if (patch.function?.name) call.function.name += patch.function.name
      if (patch.function?.arguments) call.function.arguments += patch.function.arguments
      if (call.function.arguments.length > 4000 || call.id.length > 256 || call.function.name.length > 80) throw new Error('Tool output limit')
      calls.set(patch.index, call)
    }
    if (choice?.finish_reason) finished = true
  }
  try {
    while (true) {
      const { done, value } = await reader.read()
      buffer += done ? decoder.decode() : decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const item of lines) line(item)
      if (buffer.length > 100_000) throw new Error('SSE event too large')
      if (done) { if (buffer.trim()) line(buffer); break }
    }
    if (!finished) throw new Error('Model stream ended before completion')
    const toolCalls = [...calls.entries()].sort(([a], [b]) => a - b).map(([, call]) => call)
    if (toolCalls.some(c => !c.id || !c.function.name) || new Set(toolCalls.map(c => c.id)).size !== toolCalls.length) throw new Error('Incomplete tool calls')
    return { content, toolCalls, sawReasoning }
  } finally {
    await reader.cancel().catch(() => {})
    reader.releaseLock()
  }
}
