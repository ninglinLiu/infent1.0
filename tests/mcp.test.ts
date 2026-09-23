import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { createMcpServer } from '../lib/ai/mcp-server'

test('real MCP client discovers both tools and reads a price through the shared executor', async () => {
  const server = createMcpServer({ fetcher: async () => new Response(JSON.stringify({ data: { base: 'BTC', amount: '100', currency: 'USD' } })) })
  const client = new Client({ name: 'infent-test', version: '1.0.0' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await server.connect(a)
  await client.connect(b)
  try {
    const list = await client.listTools()
    assert.deepEqual(list.tools.map(t => t.name).sort(), ['get_onchain_stats', 'get_price'])
    const result = await client.callTool({ name: 'get_price', arguments: { symbol: 'BTC' } })
    assert.equal(result.isError, false)
    const content = result.content as Array<{ type: string; text: string }>
    assert.equal(JSON.parse(content[0].text).data.price, 100)
  } finally { await client.close(); await server.close() }
})

test('stdio entrypoint starts outside the repo and supports MCP initialize/list', async () => {
  const client = new Client({ name: 'stdio-test', version: '1.0.0' })
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.resolve('node_modules/tsx/dist/cli.mjs'), '--tsconfig', path.resolve('tsconfig.json'), path.resolve('scripts/mcp-server.ts')], cwd: path.parse(process.cwd()).root, stderr: 'pipe' })
  try {
    await client.connect(transport)
    assert.equal((await client.listTools()).tools.length, 2)
  } finally { await client.close(); await transport.close() }
})
