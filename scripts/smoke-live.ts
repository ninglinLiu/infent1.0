import { loadEnvConfig } from '@next/env'
import { mkdir, writeFile } from 'node:fs/promises'
import { getChatConfig } from '../lib/ai/config'
import { executeTool } from '../lib/ai/tools'
import { runAgent } from '../lib/ai/agent'
import { buildSystemPrompt } from '../lib/ai/system-prompt'
import { selectStrategies } from '../lib/ai/structured'

async function main() {
  const envArg = process.argv.indexOf('--env-dir')
  loadEnvConfig(envArg >= 0 ? process.argv[envArg + 1] : process.cwd(), false, { info() {}, error() {} })
  const config = getChatConfig()
  const price = await executeTool('get_price', { symbol: 'BTC' })
  const stock = await executeTool('get_price', { symbol: 'AAPL' })
  const onchain = await executeTool('get_onchain_stats', { address: '0x0000000000000000000000000000000000000000' })
  console.log(JSON.stringify({ modelConfigured: Boolean(config), model: config?.model, price, stock, onchain }, null, 2))
  let agent: unknown = null, selection: unknown = null
  if (config) {
    agent = await runAgent([
      { role: 'system', content: buildSystemPrompt({ lang: 'zh', context: '' }) },
      { role: 'user', content: '请通过工具查 BTC 当前价格，并注明来源和数据时间。' },
    ], { config, signal: AbortSignal.timeout(60000), onText() {} })
    selection = await selectStrategies('如何理解降息对资产配置的影响？', ['stead-grow'], 'zh', { config, signal: AbortSignal.timeout(15000) })
    console.log(JSON.stringify({ agent, selection }, null, 2))
  }
  await mkdir('eval/results', { recursive: true })
  await writeFile('eval/results/live-smoke.json', JSON.stringify({ generatedAt: new Date().toISOString(), model: config?.model, price, stock, onchain, agent, selection }, null, 2))
}
main().catch(() => { console.error('Live smoke failed; inspect network and provider configuration. No credentials were printed.'); process.exitCode = 1 })
