import { z } from 'zod'
import { resolveInstrument } from '../market/presets'

export const priceInput = z.object({ symbol: z.string().trim().min(1).max(24).regex(/^[A-Za-z0-9.^=-]+$/) }).strict()
export const onchainInput = z.object({ address: z.string().regex(/^0x[0-9a-fA-F]{40}$/) }).strict()
export const TOOL_DEFINITIONS = [
  { type: 'function', function: {
    name: 'get_price',
    description: 'Read an actual quote. Use BTC/ETH/SOL or Yahoo tickers such as AAPL, 600519.SS, 0700.HK. Include source, currency and quote time in your answer. Never guess a price if this fails.',
    parameters: { type: 'object', properties: { symbol: { type: 'string', description: 'Ticker, not a company name or URL' } }, required: ['symbol'], additionalProperties: false },
  } },
  { type: 'function', function: {
    name: 'get_onchain_stats',
    description: 'Read Ethereum mainnet native ETH balance and outgoing transaction nonce at one block. Does NOT return token holdings, trades, profit, win rate, or identity.',
    parameters: { type: 'object', properties: { address: { type: 'string', pattern: '^0x[0-9a-fA-F]{40}$' } }, required: ['address'], additionalProperties: false },
  } },
] as const

export type ToolName = typeof TOOL_DEFINITIONS[number]['function']['name']
export type ToolResult =
  | { ok: true; source: string; observedAt: string; data: Record<string, unknown> }
  | { ok: false; code: 'INVALID_ARGUMENTS' | 'UNKNOWN_TOOL' | 'TIMEOUT' | 'UNAVAILABLE'; message: string }
export type ToolTrace = { id: string; name: string; arguments: Record<string, unknown>; result: ToolResult; durationMs: number }
export type ToolOptions = { fetcher?: typeof fetch; signal?: AbortSignal; timeoutMs?: number; rpcUrl?: string }

const numberValue = z.number().finite()
const quantity = z.string().regex(/^0x[0-9a-f]+$/i)

async function json(url: string, options: ToolOptions, init?: RequestInit): Promise<unknown> {
  const res = await (options.fetcher ?? fetch)(url, { ...init, signal: options.signal, cache: 'no-store' })
  if (!res.ok) throw new Error('Data provider unavailable')
  return res.json()
}

async function price(args: z.infer<typeof priceInput>, options: ToolOptions): Promise<ToolResult> {
  const symbol = args.symbol.toUpperCase()
  if (['BTC', 'ETH', 'SOL', 'BTC-USD', 'ETH-USD', 'SOL-USD'].includes(symbol)) {
    const base = symbol.replace('-USD', '')
    const response = z.object({ data: z.object({ amount: z.string(), base: z.literal(base), currency: z.literal('USD') }) })
      .parse(await json(`https://api.coinbase.com/v2/prices/${base}-USD/spot`, options))
    const amount = numberValue.positive().parse(Number(response.data.amount))
    return { ok: true, source: 'Coinbase spot', observedAt: new Date().toISOString(), data: {
      symbol: `${base}-USD`, price: amount, currency: 'USD', quotedAt: null,
      note: 'Spot snapshot. The provider does not supply a quote timestamp; observedAt is retrieval time.',
    } }
  }
  const ticker = resolveInstrument(symbol)?.yahoo ?? symbol
  const response = z.object({ chart: z.object({ result: z.array(z.object({ meta: z.object({
    symbol: z.string(), regularMarketPrice: numberValue.positive(), regularMarketTime: numberValue.positive(), currency: z.string().min(1),
  }) })).nonempty() }) }).parse(await json(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`, options,
    { headers: { 'User-Agent': 'Infent Research/1.0' } },
  ))
  const meta = response.chart.result[0].meta
  return { ok: true, source: 'Yahoo Finance', observedAt: new Date().toISOString(), data: {
    symbol: meta.symbol, price: meta.regularMarketPrice, currency: meta.currency,
    quotedAt: new Date(meta.regularMarketTime * 1000).toISOString(),
    note: 'Latest provider quote; may be delayed or from the last trading session.',
  } }
}

function weiToEth(value: bigint): string {
  const raw = value.toString().padStart(19, '0')
  const fraction = raw.slice(-18).replace(/0+$/, '')
  return `${raw.slice(0, -18)}${fraction ? '.' + fraction : ''}`
}

async function onchain(args: z.infer<typeof onchainInput>, options: ToolOptions): Promise<ToolResult> {
  // Only server configuration controls the endpoint; the model cannot choose a URL.
  const url = options.rpcUrl ?? process.env.ETH_RPC_URL ?? 'https://ethereum-rpc.publicnode.com'
  let nextId = 0
  const rpc = async (method: string, params: unknown[]) => {
    const id = ++nextId
    const body = z.object({ jsonrpc: z.literal('2.0'), id: z.literal(id), result: z.unknown(), error: z.unknown().optional() })
      .parse(await json(url, options, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id, method, params }) }))
    if (body.error || body.result === undefined || body.result === null) throw new Error('RPC error')
    return body.result
  }
  const chain = quantity.parse(await rpc('eth_chainId', []))
  if (BigInt(chain) !== BigInt(1)) throw new Error('RPC is not Ethereum mainnet')
  const block = z.object({ number: quantity, hash: z.string().regex(/^0x[0-9a-f]{64}$/i), timestamp: quantity })
    .parse(await rpc('eth_getBlockByNumber', ['latest', false]))
  // Hash pinning prevents a reorg from mixing state across the two requests.
  const atBlock = { blockHash: block.hash, requireCanonical: true }
  const [balance, nonce] = await Promise.all([
    rpc('eth_getBalance', [args.address, atBlock]), rpc('eth_getTransactionCount', [args.address, atBlock]),
  ])
  const wei = BigInt(quantity.parse(balance))
  return { ok: true, source: 'Ethereum JSON-RPC', observedAt: new Date().toISOString(), data: {
    address: args.address, chainId: 1, blockNumber: BigInt(block.number).toString(), blockHash: block.hash,
    blockTime: new Date(Number(BigInt(block.timestamp)) * 1000).toISOString(),
    balanceWei: wei.toString(), balanceEth: weiToEth(wei), outgoingTransactionCount: BigInt(quantity.parse(nonce)).toString(),
    note: 'Native ETH and outgoing nonce only. Not token holdings, total activity, trading performance or identity.',
  } }
}

export async function executeTool(name: string, input: unknown, options: ToolOptions = {}): Promise<ToolResult> {
  if (name !== 'get_price' && name !== 'get_onchain_stats') return { ok: false, code: 'UNKNOWN_TOOL', message: 'Tool is not available.' }
  const parsed = (name === 'get_price' ? priceInput : onchainInput).safeParse(input)
  if (!parsed.success) return { ok: false, code: 'INVALID_ARGUMENTS', message: name === 'get_price' ? 'Provide a ticker (e.g. BTC, AAPL, 600519.SS), not a URL.' : 'Provide a 0x-prefixed 40-hex-character Ethereum address.' }
  const timeout = AbortSignal.timeout(options.timeoutMs ?? 8000)
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  try {
    return name === 'get_price'
      ? await price(priceInput.parse(parsed.data), { ...options, signal })
      : await onchain(onchainInput.parse(parsed.data), { ...options, signal })
  } catch {
    return { ok: false, code: signal.aborted ? 'TIMEOUT' : 'UNAVAILABLE', message: signal.aborted ? 'Data request timed out or was cancelled. No data is available.' : 'No verified data is available from the provider. Do not invent a replacement.' }
  }
}
