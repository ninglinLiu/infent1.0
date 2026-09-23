# Infent · 可核对的投资研究 Agent

Next.js + TypeScript 的双语投资研究原型。首页和仪表盘接同一套真实模型、RAG 与只读工具；保留既有实时 K 线和教学模拟界面。

本次改造的实际测试结果、部署步骤与已知限制见 [P1 验收记录](docs/P1_VERIFICATION.md)。

## 哪些数据是真的

| 功能 | 数据与边界 |
|---|---|
| 对话 | 服务端调用 OpenAI 兼容协议的模型，流式返回；未配置密钥会明确说明 |
| 知识库 | 作者的 7 篇研究笔记、43 个切块；默认词法检索，有中英文金融术语扩展 |
| `get_price(symbol)` | BTC/ETH/SOL 用 Coinbase spot；股票/ETF 使用 Yahoo Finance 最新报价，可延迟 |
| `get_onchain_stats(address)` | 以太坊主网，同一区块哈希下的原生 ETH 余额与 outgoing nonce；不是代币持仓、收益率或钱包画像 |
| K 线 | 保留原项目的 Eastmoney/Yahoo 接口和搜索 |
| 策略卡、持仓、执行、资讯、风险面板 | 教学模拟。卡片业绩数字不是实测、收益保证或真实订单 |

工具结果保留来源、查询时间和提供方时间。Coinbase 没有报价时间戳时 `quotedAt=null`，不能把 `observedAt` 当成交时间。失败时返回明确错误，不填假行情。

## 本地启动

需要 Node.js 22 和 npm。

```bash
npm ci
# 复制 .env.example 为 .env.local，填入已有的模型配置
npm run build:knowledge
npm run dev
```

首页 `/#live-agent` 可直接提问；`/dashboard` 的 Agent 标签提供同样的服务。无需模型密钥也能运行页面、离线评测和测试。

```bash
npm run typecheck
npm run lint
npm test
npm run eval
npm run build
npm start
```

生产部署必须使用 Next.js 服务端，不能静态 export；聊天和行情 API 需要 Node runtime。字体随 npm 依赖本地打包，构建不下载 Google Fonts。

## Agent 工作流

1. 限制请求大小、角色、轮数和每条字符数；拒绝客户端 system 消息。
2. 明确的拒答规则处理保证收益、编造数据和少量范围外请求；其他问题由系统提示词约束。
3. 检索作者研究笔记并加入系统上下文。
4. 解析模型 SSE 的工具调用，校验参数，执行只读查询，再把结果回填模型。最多 3 个工具轮次、6 次调用，然后必须回答。
5. 保留流式正文和工具查询记录；取消或超时中断上游。
6. 对有候选卡片的问题，让模型输出符合 JSON Schema 的卡片 ID/理由。服务端 Zod 校验、候选 ID 白名单校验；失败回退确定性匹配。无相关候选时不强推卡片。

`LLM_STRUCTURED_OUTPUT=json_object` 是默认兼容模式：Schema 放入提示词，服务器严格验证。`json_schema` 模式向支持的 provider 传严格 Schema。不保证所有 OpenAI 兼容模型都支持相同的 tools/JSON 能力。

聊天文本由 React 转义，只支持安全的加粗展示，不执行模型输出的 HTML。

## MCP

独立的 stdio MCP server 与网页共享同一个工具执行器，不另写一套行情逻辑。无需模型密钥。两个工具均声明为只读。

可用 `npm run --silent mcp` 启动；Claude Desktop / Cursor 的配置示例：

```json
{
  "mcpServers": {
    "infent": {
      "command": "node",
      "args": [
        "/ABSOLUTE/PATH/infent1.0/node_modules/tsx/dist/cli.mjs",
        "--tsconfig",
        "/ABSOLUTE/PATH/infent1.0/tsconfig.json",
        "/ABSOLUTE/PATH/infent1.0/scripts/mcp-server.ts"
      ],
      "env": {
        "ETH_RPC_URL": "https://ethereum-rpc.publicnode.com"
      }
    }
  }
}
```

Windows 路径可以写成 `C:/Users/.../infent1.0/...`。服务端 stdout 只用于 MCP 协议。自动测试用真实 MCP 客户端完成 initialize、listTools、callTool，并测试从仓库外启动 stdio。

## 30 条评测与回归

`eval/cases.json` 标注了预期文档、正文引用关键词和应否拒答，覆盖 7 篇笔记的中英文问题、负例及数据查询。

- `npm run eval`：不调用模型。报告检索参考资料命中率、负例无引用率、拒答**规则路由**准确率；失败退出 1。
- `npm run eval:live`：使用配置的真实模型运行同一套问题，额外测正文引用关键词是否出现、请求是否成功。会消耗模型额度。
- `npm run test:live`：少量真实工具查询、模型查价、JSON 选卡冒烟测试。
- 报告保存到 `eval/results/`，不默认提交问答日志。
- GitHub Actions 在 push/PR 自动跑类型、lint、单元/协议测试、离线评测和构建。工作流也提供手动的真实模型评测开关，使用 `LLM_API_KEY` repository secret。

这些是小规模开发回归集，**不是独立测试集上的模型质量、事实正确率或投资收益评测**。正文引用出现也不等于引用内容支持结论；上线前需人工检查回答。改提示词会触发 CI，语义效果需再运行真实模型评测。

## 手机与 PWA

首页和仪表盘按屏宽重排，手机顶部可横向切换功能，Agent 页面保留完整聊天输入区。生产构建提供 manifest、512px PNG 图标、Apple 图标和 Service Worker。

Chrome/Edge 支持安装提示；iOS Safari 可用“分享 → 添加到主屏幕”。需要 HTTPS 或 localhost。Service Worker **只缓存离线提示页**，不缓存对话、地址查询、行情或持仓；离线时不会显示旧报价。

浏览器回归（默认使用本机 Edge）：

```bash
npm run build
npm run test:browser
```

覆盖桌面、768px 平板、390px 手机、输入框可见性、模型 HTML 安全渲染、工具证据、manifest/icon 和离线页。离线页是独立 HTML，不依赖断网后无法下载的 React chunks。

## Vercel

使用现有项目、默认 Next.js build 配置。填入 `.env.example` 的服务端环境变量，然后部署。

Web Analytics 已接入组件。需在 Vercel 项目启用 Analytics，再设 `NEXT_PUBLIC_ENABLE_ANALYTICS=true` 并重建。没有编造或预填用户数；不会发送聊天正文或地址作为自定义事件。

## 已知边界

- IP 限流是单进程内存版；多实例部署不等于全局额度管理。
- 免费行情/RPC 可能限流、超时或延迟；真实查询失败会展示错误。生产可配置自己的主网 RPC。
- 英文检索使用有限术语扩展，不等于任意语言向量检索。可用 `npm run build:knowledge -- --embed` 选配 embedding。
- 收益归因基准、Coding Agent、JD Workflow 属于 P2–P4，不在本仓库这次 P1 改造范围。
- 本产品用于研究与教育，不连接券商，不提交真实交易。

接口参考：[DeepSeek tool calls](https://api-docs.deepseek.com/guides/tool_calls/)、[JSON output](https://api-docs.deepseek.com/guides/json_mode/)、[MCP server guide](https://modelcontextprotocol.io/docs/develop/build-server)。
