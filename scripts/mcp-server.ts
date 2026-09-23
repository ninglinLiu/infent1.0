import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createMcpServer } from '../lib/ai/mcp-server'
import { loadEnvConfig } from '@next/env'
import path from 'node:path'

// Keep stdout exclusively for JSON-RPC. Paths are resolved from this file, not client cwd.
loadEnvConfig(path.resolve(import.meta.dirname, '..'), false, { info() {}, error() {} })
const server = createMcpServer()
server.connect(new StdioServerTransport()).catch(() => { console.error('Infent MCP server failed to start.'); process.exitCode = 1 })
