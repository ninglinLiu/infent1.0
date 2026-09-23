"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type Lang = "zh" | "en"

// =========================================================
// Dictionary
// =========================================================
const DICT = {
  // TopBar
  "topbar.reset": { zh: "重置 Demo", en: "Reset demo" },
  "topbar.resetBtn": { zh: "重置", en: "Reset" },
  "topbar.theme": { zh: "主题切换", en: "Toggle theme" },
  "topbar.cmd":   { zh: "命令面板",  en: "Command palette" },

  // Left rail
  "rail.workspace":  { zh: "工作台",       en: "Workspace" },
  "rail.agent":      { zh: "全屏 Agent",    en: "Agent (full-screen)" },
  "rail.markets":    { zh: "市场",          en: "Markets" },
  "rail.discover":   { zh: "发现",          en: "Discover" },
  "rail.backtest":   { zh: "回测",          en: "Backtest" },
  "rail.risk":       { zh: "风控",          en: "Risk" },
  "rail.journal":    { zh: "交易日志",      en: "Journal" },
  "rail.settings":   { zh: "设置",          en: "Settings" },
  "rail.back":       { zh: "回到展示面",    en: "Back to landing" },

  // View titles
  "view.workspace.title": { zh: "工作台",        en: "Workspace" },
  "view.workspace.sub":   { zh: "完整控制台 · AI 助手 + 图表 + 风控", en: "Full console · AI copilot + charts + risk" },
  "view.agent.title":     { zh: "Agent 模式",    en: "Agent Mode" },
  "view.agent.sub":       { zh: "全屏对话式投研", en: "Full-screen conversational investing" },
  "view.markets.title":   { zh: "全球市场",      en: "Markets" },
  "view.markets.sub":     { zh: "全球指数 · 个股 · 板块热力", en: "Global overview · tickers · sector heatmap" },
  "view.discover.title":  { zh: "发现",          en: "Discover" },
  "view.discover.sub":    { zh: "每日 Alpha · 热门策略 · 情绪流", en: "Today's Alpha · trending strategies · sentiment" },
  "view.backtest.title":  { zh: "策略回测",      en: "Backtest" },
  "view.backtest.sub":    { zh: "权益曲线回放 · 夏普 · 回撤", en: "Equity replay · Sharpe · drawdown" },
  "view.risk.title":      { zh: "风险管理",      en: "Risk" },
  "view.risk.sub":        { zh: "因子分解 · 压力测试 · 持仓暴露", en: "Factor breakdown · stress scenarios · exposure" },
  "view.journal.title":   { zh: "交易日志",      en: "Journal" },
  "view.journal.sub":     { zh: "执行历史 · 实现盈亏 · 审计日志", en: "Execution history · realised PnL · audit log" },
  "view.settings.title":  { zh: "系统设置",      en: "Settings" },
  "view.settings.sub":    { zh: "用户画像 · 外观 · 通知 · 账户安全", en: "Profile · appearance · notifications · security" },

  // Metric cards
  "metric.nav":          { zh: "组合净值",        en: "Portfolio NAV" },
  "metric.nav.sub":      { zh: "折合人民币 ≈ ¥1,798K", en: "Equity under management" },
  "metric.pnl":          { zh: "今日盈亏",        en: "Daily P&L" },
  "metric.pnl.sub":      { zh: "已实现 +$412 · 未实现 +$1,430", en: "Realised +$412 · unrealised +$1,430" },
  "metric.sharpe":       { zh: "夏普比率",        en: "Sharpe ratio" },
  "metric.sharpe.sub":   { zh: "行业基准 0.92 · 超额 +53%", en: "Benchmark 0.92 · excess +53%" },
  "metric.sharpe.delta": { zh: "近 30D",          en: "Last 30D" },
  "metric.win":          { zh: "策略胜率",        en: "Win rate" },
  "metric.win.sub":      { zh: "AI 信号数 127 · 采纳 74", en: "127 AI signals · 74 adopted" },
  "metric.win.delta":    { zh: "过去 90D",        en: "Last 90D" },

  // KLine chart
  "kline.live":       { zh: "实时行情", en: "Live market" },
  "kline.search":     { zh: "搜索代码", en: "Search symbol" },
  "kline.search.ph":  { zh: "NVDA / 腾讯 / 600519", en: "NVDA, 0700, AAPL…" },
  "kline.loading":    { zh: "正在拉取 K 线…", en: "Loading candles…" },
  "kline.error":      { zh: "行情暂时拉不到", en: "Could not load market data" },
  "kline.retry":      { zh: "重试", en: "Retry" },
  "kline.empty":      { zh: "没有找到匹配标的", en: "No matching symbols" },
  "kline.source.eastmoney": { zh: "东方财富", en: "Eastmoney" },
  "kline.source.yahoo":     { zh: "Yahoo Finance", en: "Yahoo Finance" },
  "kline.tv":         { zh: "在 TradingView 打开", en: "Open in TradingView" },
  "kline.fullscreen": { zh: "全屏", en: "Fullscreen" },
  "kline.exitfs":     { zh: "退出全屏", en: "Exit fullscreen" },
  "kline.bars":       { zh: "根", en: "bars" },
  "kline.popular":    { zh: "搜索结果", en: "Results" },
  "kline.attribution":{ zh: "图表引擎 TradingView Lightweight Charts", en: "Charting by TradingView Lightweight Charts" },
  "kline.ai.win":     { zh: "AI 胜率", en: "AI win rate" },
  "kline.legend.history": { zh: "历史 K 线", en: "Historical" },
  "kline.legend.forecast":{ zh: "AI 预测轨迹", en: "AI forecast" },
  "kline.legend.buy":     { zh: "BUY 信号", en: "BUY signal" },
  "kline.legend.sell":    { zh: "SELL 信号", en: "SELL signal" },
  "kline.exec.title":     { zh: "策略执行标记", en: "Strategy marks" },

  // Portfolio
  "portfolio.title":  { zh: "当前持仓", en: "Current holdings" },
  "portfolio.count":  { zh: "标的",     en: "positions" },
  "portfolio.col.symbol": { zh: "标的", en: "Symbol" },
  "portfolio.col.qty":    { zh: "持仓", en: "Qty" },
  "portfolio.col.last":   { zh: "现价", en: "Last" },
  "portfolio.col.weight": { zh: "权重", en: "Weight" },
  "portfolio.col.today":  { zh: "今日", en: "Today" },

  // Heatmap
  "heatmap.title":  { zh: "板块热力 · 今日", en: "Sector heatmap · today" },
  "heatmap.alpha":  { zh: "Alpha 信号", en: "Alpha signal" },

  // News
  "news.title": { zh: "实时资讯 · 情绪流", en: "News & sentiment feed" },

  // Strategy timeline
  "timeline.title":  { zh: "策略执行时间线", en: "Strategy execution timeline" },
  "timeline.running":{ zh: "执行中",         en: "Running" },
  "timeline.empty.t":{ zh: "尚无执行中的策略", en: "No strategy running" },
  "timeline.empty.sub":{ zh: "在 Agent 对话中点一张策略卡的「执行策略」，全盘将联动演示", en: "Hit 'Execute' on a strategy card in the Agent chat — the whole console animates." },
  "timeline.expected": { zh: "预期年化",   en: "Expected annualised" },
  "timeline.drawdown": { zh: "最大回撤",   en: "Max drawdown" },
  "timeline.winrate":  { zh: "回测胜率",   en: "Backtest win rate" },
  "timeline.horizon":  { zh: "持续周期",   en: "Horizon" },
  "timeline.action.alloc": { zh: "再平衡", en: "Rebalance" },
  "timeline.action.buy":   { zh: "买入",   en: "Buy" },
  "timeline.action.sell":  { zh: "卖出",   en: "Sell" },
  "timeline.action.hold":  { zh: "持有",   en: "Hold" },

  // Agent chat
  "agent.name":       { zh: "Omni-AI Agent", en: "Omni-AI Agent" },
  "agent.subtitle":   { zh: "投资研究 · 实时工具 · 来源可查", en: "Investment research · tools · verifiable sources" },
  "agent.online":     { zh: "研究助手",         en: "Research" },
  "agent.sources": { zh: "检索参考资料", en: "Retrieved references" },
  "agent.stop": { zh: "停止", en: "Stop" },
  "agent.fallback": { zh: "策略卡采用规则匹配（结构化输出降级）", en: "Cards selected by rules (structured output fallback)" },
  "agent.quickHint":  { zh: "日常金融快问 · 点一下直接问 Agent", en: "Quick questions · tap to ask the agent" },
  "agent.placeholder":{ zh: "问我任何金融问题 · 比如「我手上有 20 万想买房首付怎么理」", en: "Ask any investment question · e.g. \"How should I invest $30K for a home down-payment?\"" },
  "agent.send":       { zh: "发送",         en: "Send" },
  "agent.exec":       { zh: "模拟执行",     en: "Simulate strategy" },
  "agent.executing":  { zh: "执行中…",       en: "Executing…" },
  "agent.showReason": { zh: "查看 AI 推理", en: "Show AI reasoning" },
  "agent.hideReason": { zh: "收起推理",     en: "Hide reasoning" },
  "agent.expReturn":  { zh: "预期年化",     en: "Expected return" },
  "agent.horizon":    { zh: "持续周期",     en: "Horizon" },
  "agent.winRate":    { zh: "回测胜率",     en: "Win rate" },
  "agent.drawdown":   { zh: "最大回撤",     en: "Max DD" },
  "agent.intro.p1":   {
    zh: "你好 👋 我是 **Omni-AI**，专属金融 Agent。不管你是月薪 5000 的新手，还是持仓百万的老股民，我都能把市场翻译成你能懂的语言。",
    en: "Hi 👋 I'm **Omni-AI**, your personal financial agent. Whether you're a new investor on a $700/mo salary or managing $1M+ in positions, I'll translate the market into language you actually understand.",
  },
  "agent.intro.p2":   {
    zh: "点下面的快问按钮试一下 —— 我会给你可执行的策略卡，点「执行策略」，整个 dashboard 会实时演示效果。",
    en: "Tap any quick-question below — I'll return an executable strategy card. Hit 'Execute' and the whole dashboard animates in real time.",
  },
  "agent.action.buy": { zh: "买", en: "Buy" },
  "agent.action.sell":{ zh: "卖", en: "Sell" },
  "agent.action.hold":{ zh: "持有", en: "Hold" },

  // Toasts
  "toast.executing":  { zh: "正在执行：", en: "Executing: " },
  "toast.completed":  { zh: " 执行完成 · 预期年化 +", en: " completed · expected +" },
  "toast.buy":        { zh: "买入", en: "Bought" },
  "toast.sell":       { zh: "卖出", en: "Sold" },
  "toast.position":   { zh: " 仓位", en: " of portfolio" },

  // Lang toggle
  "lang.label": { zh: "语言", en: "Language" },

  // Dashboard (misc)
  "dash.live":    { zh: "实时",  en: "LIVE" },

  // Common
  "common.confidence": { zh: "置信度", en: "Confidence" },
  "common.seeAll":     { zh: "查看全部 →", en: "See all →" },

  // Showcase landing nav
  "showcase.nav.problem":   { zh: "问题", en: "Problem" },
  "showcase.nav.solution":  { zh: "方案", en: "Solution" },
  "showcase.nav.landscape": { zh: "竞争", en: "Landscape" },
  "showcase.nav.value":     { zh: "价值", en: "Value" },
  "showcase.nav.brand":     { zh: "品牌", en: "Brand" },
  "showcase.nav.team":      { zh: "团队", en: "Team" },
  "showcase.launch":        { zh: "打开控制台", en: "Launch App" },
  "showcase.github":        { zh: "源码", en: "GitHub" },
} as const

export type DictKey = keyof typeof DICT

// =========================================================
// Provider
// =========================================================
type LangCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
  t: (k: DictKey) => string
}

const Ctx = createContext<LangCtx | null>(null)

const STORAGE_KEY = "omni.lang"

export function LangProvider({ children, initial = "zh" }: { children: React.ReactNode; initial?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initial)

  // Pull from localStorage on mount (after hydration so SSR stays stable)
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as Lang | null
      if (saved === "zh" || saved === "en") setLangState(saved)
    } catch {}
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      window.localStorage.setItem(STORAGE_KEY, l)
      document.documentElement.setAttribute("lang", l === "en" ? "en" : "zh-CN")
    } catch {}
  }, [])

  const toggle = useCallback(() => {
    setLang(lang === "zh" ? "en" : "zh")
  }, [lang, setLang])

  const t = useCallback(
    (k: DictKey) => {
      const entry = DICT[k]
      if (!entry) return String(k)
      return entry[lang] ?? entry.en
    },
    [lang]
  )

  const value = useMemo(() => ({ lang, setLang, toggle, t }), [lang, setLang, toggle, t])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useLang must be used inside <LangProvider>")
  return ctx
}

// Convenience t-only hook to avoid destructuring the whole context.
export function useT() {
  return useLang().t
}
