import test from 'node:test'
import assert from 'node:assert/strict'
import { runAgent, AGENT_LIMITS } from '../lib/ai/agent'
import { readCompletionStream } from '../lib/ai/provider'
import { executeTool } from '../lib/ai/tools'
import { validateSelection, selectStrategies } from '../lib/ai/structured'
import { splitMeta, encodeMeta, META_DELIMITER } from '../lib/ai/protocol'
import { matchStrategies } from '../lib/ai/strategy-match'

const config = { baseUrl: 'https://model.invalid/v1', apiKey: 'test-key', model: 'test-model' }
const options = () => ({ config, signal: AbortSignal.timeout(10_000) })
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
function sse(events: unknown[], fragment = false) {
  const bytes = new TextEncoder().encode(events.map(delta => `data: ${JSON.stringify({ choices: [{ delta }] })}\r\n\r\n`).join('') + 'data: [DONE]')
  return new Response(new ReadableStream({ start(c) {
    if (fragment) for (let i = 0; i < bytes.length; i += 3) c.enqueue(bytes.slice(i, i + 3))
    else c.enqueue(bytes)
    c.close()
  } }))
}
const call = (id: string, name: string, args: string) => ({ tool_calls: [{ index: 0, id, type: 'function', function: { name, arguments: args } }] })

test('SSE joins UTF-8 and fragmented tool arguments, handles final line without newline', async () => {
  let text = ''
  const result = await readCompletionStream(sse([
    { content: '你好' }, call('one', 'get_price', '{"sym'),
    { tool_calls: [{ index: 0, function: { arguments: 'bol":"BTC"}' } }] },
  ], true), s => { text += s })
  assert.equal(text, '你好')
  assert.equal(result.toolCalls[0].function.arguments, '{"symbol":"BTC"}')
})
test('truncated model streams are errors', async () => {
  await assert.rejects(readCompletionStream(new Response('data: {"choices":[{"delta":{"content":"partial"}}]}\n'), () => {}), /before completion/)
})
test('model tool request -> tool result -> second tool -> final streamed answer', async () => {
  let round = 0, answer = ''
  const fetcher: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body))
    round++
    if (round === 1) return sse([call('p1', 'get_price', '{"symbol":"BTC"}')])
    if (round === 2) {
      assert.equal(body.messages.at(-1).tool_call_id, 'p1')
      assert.equal(JSON.parse(body.messages.at(-1).content).data.price, 100)
      return sse([call('p2', 'get_price', '{"symbol":"ETH"}')])
    }
    assert.equal(body.messages.at(-1).tool_call_id, 'p2')
    return sse([{ content: 'Verified ' }, { content: 'quotes.' }])
  }
  const toolFetch: typeof fetch = async url => json({ data: { base: String(url).includes('BTC') ? 'BTC' : 'ETH', amount: '100', currency: 'USD' } })
  const result = await runAgent([{ role: 'user', content: 'Compare BTC and ETH' }], { ...options(), fetcher, toolOptions: { fetcher: toolFetch }, onText: s => { answer += s } })
  assert.equal(answer, 'Verified quotes.')
  assert.equal(result.traces.length, 2)
  assert.equal(round, 3)
})
test('loop budget disables tools and rejects a provider that ignores the limit', async () => {
  let round = 0
  const fetcher: typeof fetch = async (_url, init) => {
    round++
    if (round === AGENT_LIMITS.rounds + 1) assert.equal(JSON.parse(String(init?.body)).tool_choice, 'none')
    return sse([call(`c${round}`, 'unknown', '{}')])
  }
  await assert.rejects(runAgent([{ role: 'user', content: 'repeat' }], { ...options(), fetcher, onText() {} }), /limit/)
  assert.equal(round, 4)
})
test('tools validate inputs and never fetch URLs supplied as symbols', async () => {
  const fetcher: typeof fetch = async () => { throw new Error('must not fetch') }
  assert.deepEqual((await executeTool('get_price', { symbol: 'https://localhost' }, { fetcher })).ok, false)
  assert.equal((await executeTool('get_onchain_stats', { address: '0x123' }, { fetcher })).ok, false)
  assert.equal((await executeTool('unknown', {}, { fetcher })).ok, false)
})
test('provider error, malformed response and timeout never fabricate a price', async () => {
  for (const fetcher of [async () => json({}, 503), async () => json({ data: { base: 'BTC', amount: 'NaN', currency: 'USD' } })]) {
    const result = await executeTool('get_price', { symbol: 'BTC' }, { fetcher })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.code, 'UNAVAILABLE')
  }
  const fetcher: typeof fetch = async (_url, init) => new Promise((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true })
    // Keep the process alive for AbortSignal.timeout's unref'ed timer.
    const keepAlive = setTimeout(() => reject(new Error('timeout test failed')), 1000)
    init?.signal?.addEventListener('abort', () => clearTimeout(keepAlive), { once: true })
  })
  const result = await executeTool('get_price', { symbol: 'BTC' }, { fetcher, timeoutMs: 10 })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.code, 'TIMEOUT')
})
test('Ethereum reads are chain checked and pinned to one block; wei stays exact', async () => {
  const hash = '0x' + 'a'.repeat(64)
  const seen: string[] = []
  const fetcher: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body))
    seen.push(body.method)
    const results: Record<string, unknown> = {
      eth_chainId: '0x1', eth_getBlockByNumber: { number: '0x64', hash, timestamp: '0x6553f100' },
      eth_getBalance: '0xde0b6b3a7640001', eth_getTransactionCount: '0x5',
    }
    if (body.method === 'eth_getBalance' || body.method === 'eth_getTransactionCount') assert.deepEqual(body.params[1], { blockHash: hash, requireCanonical: true })
    return json({ jsonrpc: '2.0', id: body.id, result: results[body.method] })
  }
  const result = await executeTool('get_onchain_stats', { address: '0x' + '1'.repeat(40) }, { fetcher })
  assert.equal(result.ok, true)
  if (result.ok) { assert.equal(result.data.balanceEth, '1.000000000000000001'); assert.equal(result.data.outgoingTransactionCount, '5') }
  assert.equal(seen.length, 4)
})
test('wrong-chain RPC cannot be labelled Ethereum', async () => {
  const result = await executeTool('get_onchain_stats', { address: '0x' + '0'.repeat(40) }, { fetcher: async (_url, init) => json({ jsonrpc: '2.0', id: JSON.parse(String(init?.body)).id, result: '0x38' }) })
  assert.equal(result.ok, false)
})
test('structured selection rejects invented IDs, duplicate cards and extra performance fields', () => {
  assert.throws(() => validateSelection({ cards: [{ strategyId: 'invented', rationale: 'example' }] }, ['stead-grow']))
  assert.throws(() => validateSelection({ cards: [{ strategyId: 'stead-grow', rationale: 'example', profit: 80 }] }, ['stead-grow']))
  assert.throws(() => validateSelection({ cards: Array(2).fill({ strategyId: 'stead-grow', rationale: 'example' }) }, ['stead-grow']))
  assert.equal(validateSelection({ cards: [] }, ['stead-grow']).cards.length, 0)
})
test('invalid JSON or unsupported schema uses deterministic fallback', async () => {
  const result = await selectStrategies('rate cut', ['stead-grow'], 'en', { ...options(), fetcher: async () => json({ choices: [{ message: { content: 'invalid' } }] }) })
  assert.equal(result.mode, 'fallback')
  assert.equal(result.cards[0].strategyId, 'stead-grow')
})
test('valid model JSON preserves the selected educational card', async () => {
  const result = await selectStrategies('rate cut', ['stead-grow'], 'en', { ...options(), fetcher: async () => json({ choices: [{ message: { content: JSON.stringify({ cards: [{ strategyId: 'stead-grow', rationale: 'Rate sensitivity example' }] }) } }] }) })
  assert.equal(result.mode, 'model')
})
test('irrelevant questions do not force a fallback strategy', () => {
  assert.deepEqual(matchStrategies(''), [])
  assert.deepEqual(matchStrategies('今天天气怎么样'), [])
})
test('metadata never flashes into the answer when delimiter arrives in fragments', () => {
  for (let i = 1; i < META_DELIMITER.length; i++) assert.equal(splitMeta('Answer' + META_DELIMITER.slice(0, i)).text, 'Answer')
  const meta = { strategyIds: [], sources: ['document'] }
  assert.deepEqual(splitMeta('Answer' + encodeMeta(meta)), { text: 'Answer', meta })
})
