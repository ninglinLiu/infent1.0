import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { executeTool, onchainInput, priceInput, TOOL_DEFINITIONS, type ToolOptions } from './tools'

export function createMcpServer(options: ToolOptions = {}) {
  const server = new McpServer({ name: 'infent-research-tools', version: '1.0.0' })
  for (const definition of TOOL_DEFINITIONS) {
    const { name, description } = definition.function
    server.registerTool(name, {
      description,
      inputSchema: name === 'get_price' ? priceInput.shape : onchainInput.shape,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    }, async (args: Record<string, unknown>, extra: { signal: AbortSignal }) => {
      const result = await executeTool(name, args, { ...options, signal: extra.signal })
      return { content: [{ type: 'text' as const, text: JSON.stringify(result) }], isError: !result.ok }
    })
  }
  return server
}
