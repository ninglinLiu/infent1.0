import { getMaxOutputTokens } from './config'
import { completion, readCompletionStream, type ModelMessage, type ProviderOptions } from './provider'
import { executeTool, TOOL_DEFINITIONS, type ToolOptions, type ToolTrace } from './tools'

export const AGENT_LIMITS = { rounds: 3, toolCalls: 6 } as const

export async function runAgent(input: ModelMessage[], options: ProviderOptions & {
  onText: (text: string) => void
  onTool?: (trace: ToolTrace) => void
  toolOptions?: ToolOptions
}) {
  const messages = [...input]
  const traces: ToolTrace[] = []
  let answer = ''
  for (let round = 0; round <= AGENT_LIMITS.rounds; round++) {
    const toolsAllowed = round < AGENT_LIMITS.rounds && traces.length < AGENT_LIMITS.toolCalls
    const response = await completion({
      messages, stream: true, temperature: 0.3, max_tokens: getMaxOutputTokens(),
      tools: TOOL_DEFINITIONS, tool_choice: toolsAllowed ? 'auto' : 'none',
    }, options)
    const turn = await readCompletionStream(response, delta => { answer += delta; options.onText(delta) })
    if (!turn.toolCalls.length) {
      if (!turn.content.trim()) throw new Error(turn.sawReasoning ? 'Reasoning budget exhausted' : 'Empty model answer')
      return { answer, traces }
    }
    if (!toolsAllowed || turn.toolCalls.length + traces.length > AGENT_LIMITS.toolCalls) throw new Error('Tool call limit reached')
    messages.push({ role: 'assistant', content: turn.content || null, tool_calls: turn.toolCalls })
    for (const call of turn.toolCalls) {
      options.signal.throwIfAborted()
      let args: unknown
      try { args = JSON.parse(call.function.arguments) } catch { args = null }
      const start = Date.now()
      const result = await executeTool(call.function.name, args, { ...options.toolOptions, signal: options.signal })
      const trace: ToolTrace = { id: call.id, name: call.function.name,
        arguments: args && typeof args === 'object' && !Array.isArray(args) ? args as Record<string, unknown> : {},
        result, durationMs: Date.now() - start }
      traces.push(trace)
      options.onTool?.(trace)
      messages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) })
    }
    if (turn.content) { answer += '\n\n'; options.onText('\n\n') }
  }
  throw new Error('Agent round limit reached')
}
