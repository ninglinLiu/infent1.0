import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getChatConfig, getRequestTimeoutMs, LIMITS } from '@/lib/ai/config'
import { buildSystemPrompt, degradedNotice } from '@/lib/ai/system-prompt'
import { retrieve, formatContext, sourceNames } from '@/lib/ai/retrieve'
import { matchStrategies } from '@/lib/ai/strategy-match'
import { encodeMeta, type ChatMeta } from '@/lib/ai/protocol'
import { refusalReason, refusalText } from '@/lib/ai/policy'
import { selectStrategies } from '@/lib/ai/structured'
import { runAgent } from '@/lib/ai/agent'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

const inputSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(LIMITS.maxCharsPerMessage) }).strict()).min(1).max(LIMITS.maxMessages),
  lang: z.enum(['zh', 'en']).default('zh'), surface: z.string().max(100).optional(),
}).strict()
const hits = new Map<string, number[]>()

function rateLimited(ip: string) {
  const now = Date.now()
  for (const [key, times] of hits) if (!times.some(t => now - t < LIMITS.rateWindowMs)) hits.delete(key)
  const times = (hits.get(ip) ?? []).filter(t => now - t < LIMITS.rateWindowMs)
  if (times.length >= LIMITS.rateMaxRequests || (!hits.has(ip) && hits.size >= 5000)) return true
  hits.set(ip, [...times, now])
  return false
}

const headers = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store, no-transform', 'X-Accel-Buffering': 'no' }

export async function POST(req: NextRequest) {
  // Bound actual bytes, not just a user-controlled Content-Length header.
  const reader = req.body?.getReader()
  if (!reader) return new Response('Missing body', { status: 400 })
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 128_000) { await reader.cancel(); return new Response('Request too large', { status: 413 }) }
      chunks.push(value)
    }
  } catch { return new Response('Invalid request body', { status: 400 }) }
  finally { reader.releaseLock() }

  let payload: z.infer<typeof inputSchema>
  try { payload = inputSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
  catch { return new Response('Invalid messages, language or request format', { status: 400 }) }
  const { messages, lang } = payload
  if (messages[messages.length - 1].role !== 'user') return new Response('Last message must be from the user', { status: 400 })
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
  if (rateLimited(ip)) return new Response('Too many requests', { status: 429, headers: { 'Retry-After': '60' } })

  const question = messages[messages.length - 1].content
  const meta: ChatMeta = { strategyIds: [], sources: [], tools: [], strategyMode: 'none' }
  const reason = refusalReason(question)
  if (reason) return new Response(refusalText(reason, lang) + encodeMeta({ ...meta, refused: true }), { headers })
  const config = getChatConfig()
  if (!config) return new Response(degradedNotice(lang) + encodeMeta({ ...meta, degraded: true }), { headers })

  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), getRequestTimeoutMs())
  const disconnect = () => abort.abort()
  req.signal.addEventListener('abort', disconnect, { once: true })
  if (req.signal.aborted) abort.abort()
  let cancelled = false
  const encoder = new TextEncoder()
  const cleanup = () => { clearTimeout(timer); req.signal.removeEventListener('abort', disconnect) }
  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (text: string) => { if (!cancelled) controller.enqueue(encoder.encode(text)) }
      try {
        const { hits: found } = await retrieve(question)
        abort.signal.throwIfAborted()
        meta.sources = sourceNames(found)
        await runAgent([{ role: 'system', content: buildSystemPrompt({ lang, context: formatContext(found), surface: payload.surface }) }, ...messages], {
          config, signal: abort.signal, onText: emit,
          onTool: trace => meta.tools!.push(trace),
        })
        const selection = await selectStrategies(question, matchStrategies(question), lang, {
          config, signal: AbortSignal.any([abort.signal, AbortSignal.timeout(8000)]),
        })
        meta.strategyIds = selection.cards.map(card => card.strategyId)
        meta.strategyCards = selection.cards
        meta.strategyMode = selection.mode
      } catch {
        meta.degraded = true
        emit(lang === 'en' ? '\n\n[The assistant could not complete this answer. Please retry; any partial output is incomplete.]' : '\n\n[本次回答未完成，请重试；已显示的部分内容不代表完整结论。]')
      } finally {
        cleanup()
        if (!cancelled) { emit(encodeMeta(meta)); controller.close() }
      }
    },
    cancel() { cancelled = true; abort.abort(); cleanup() },
  }), { headers })
}
