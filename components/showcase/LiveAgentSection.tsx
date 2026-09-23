"use client"

import { useEffect, useRef, useState } from "react"
import { Bot, Send, Square } from "lucide-react"
import { Orbs } from "./Orbs"
import { useLang } from "@/lib/i18n"
import { useChatStream, type WireMessage } from "@/lib/ai/use-chat-stream"
import type { ChatMeta } from "@/lib/ai/protocol"
import { AnswerText } from "@/components/agent/AnswerText"
import { ToolEvidence } from "@/components/agent/ToolEvidence"

type Message = WireMessage & { id: string; meta?: ChatMeta | null }

export function LiveAgentSection() {
  const { lang } = useLang()
  const zh = lang === "zh"
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const { send, stop, streaming } = useChatStream()
  const suggestions = zh
    ? ["BTC 现在多少钱？请注明来源。", "怎么判断回测是不是过拟合？", "跟着链上高手交易能赚钱吗？"]
    : ["What is the BTC price? Include the source.", "How do I tell if a backtest is overfitted?", "Why do copy-trading strategies usually fail?"]

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  async function ask(question: string) {
    const text = question.trim()
    if (!text || streaming) return
    const id = crypto.randomUUID()
    const history: WireMessage[] = [...messages.map(({ role, content }) => ({ role, content })), { role: "user", content: text }]
    setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "user", content: text }, { id, role: "assistant", content: "" }])
    setInput("")
    await send(history, {
      lang, surface: "public landing page",
      onText: content => setMessages(prev => prev.map(m => m.id === id ? { ...m, content } : m)),
      onDone: (content, meta) => setMessages(prev => prev.map(m => m.id === id ? { ...m, content, meta } : m)),
    })
  }

  return <section id="live-agent" className="relative overflow-hidden py-16 sm:py-24">
    <Orbs variant="default" />
    <div className="relative z-10 sec-x">
      <span className="chip-pill mb-6 text-[11px]">{zh ? "研究助手 · 现在试一问" : "Research assistant · try it here"}</span>
      <h2 className="display-xxl text-[clamp(36px,6vw,88px)]">
        {zh ? <>让每个回答<br /><span className="text-gradient-green">有据可查</span>。</> : <>Ask something<br /><span className="text-gradient-green">you can verify</span>.</>}
      </h2>
      <p className="mt-6 max-w-[680px] text-[15px] leading-relaxed text-[var(--fg-1)]">
        {zh ? "查询真实行情、读取以太坊账户数据，或用作者的研究笔记讨论回测与风险。每次数据查询都保留来源和时间，便于你核对。"
          : "Look up market prices, read Ethereum account data, or explore backtesting and risk through the author's research notes. Data queries include their sources and timestamps."}
      </p>
      <div className="surface mt-8 max-w-[900px] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--line-1)] bg-[var(--bg-2)] px-4 py-3">
          <Bot className="h-5 w-5 text-info" />
          <span className="font-semibold">Omni-AI</span>
          <span role="status" className="ml-auto text-[11px] text-dim">{streaming ? (zh ? "查询与生成中…" : "Looking up and writing…") : (zh ? "可提问" : "Ready")}</span>
        </div>
        <div ref={scrollRef} role="log" aria-live="polite" aria-label={zh ? "对话记录" : "Conversation"} className="thin-scroll h-[360px] sm:h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && <AnswerText text={zh
            ? "你可以问我 BTC 价格、某个以太坊地址的 ETH 余额，或如何识别过拟合。查不到的数据会明确说明，不会补一个猜测的数字。"
            : "Ask for a BTC quote, an Ethereum address's ETH balance, or how to spot overfitting. If a source is unavailable, I will say so."} />}
          {messages.map(m => <div key={m.id} className={m.role === "user" ? "ml-auto max-w-[88%] rounded-lg border border-[var(--line-2)] bg-[var(--bg-3)] p-3" : "min-w-0 space-y-2"}>
            {m.content ? <AnswerText text={m.content} /> : <span className="text-sm text-dim">{zh ? "正在处理…" : "Working…"}</span>}
            {m.meta && <>
              <ToolEvidence tools={m.meta.tools} />
              {m.meta.sources.length > 0 && <div className="border-t border-[var(--line-1)] pt-2 text-[11px] text-ghost break-words">
                {zh ? "检索参考资料：" : "Retrieved references: "}{m.meta.sources.join(" · ")}
              </div>}
            </>}
          </div>)}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-[var(--line-1)] px-3 py-3">
          {suggestions.map(s => <button key={s} disabled={streaming} onClick={() => void ask(s)} className="min-h-10 rounded-full border border-[var(--line-2)] px-3 py-2 text-left text-xs hover:text-info disabled:opacity-40">{s}</button>)}
        </div>
        <form onSubmit={e => { e.preventDefault(); void ask(input) }} className="flex gap-2 border-t border-[var(--line-1)] bg-[var(--bg-2)] p-3">
          <input value={input} onChange={e => setInput(e.target.value)} disabled={streaming} maxLength={4000}
            onKeyDown={e => { if (e.key === 'Enter' && e.nativeEvent.isComposing) e.preventDefault() }}
            aria-label={zh ? "向研究助手提问" : "Ask the research assistant"}
            placeholder={zh ? "问行情、回测或风险…" : "Ask about prices, backtests or risk…"}
            className="min-w-0 flex-1 rounded-md border border-[var(--line-2)] bg-[var(--bg-1)] px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400" />
          {streaming ? <button type="button" onClick={stop} className="min-h-11 rounded-md border border-[var(--line-2)] px-3 flex items-center gap-1 text-sm"><Square size={14} />{zh ? "停止" : "Stop"}</button>
            : <button type="submit" disabled={!input.trim()} className="min-h-11 rounded-md bg-up px-3 text-black disabled:opacity-40 flex items-center gap-1 text-sm"><Send size={14} />{zh ? "发送" : "Send"}</button>}
        </form>
      </div>
      <p className="mt-4 max-w-[900px] text-[11px] leading-relaxed text-ghost">
        {zh ? "研究与教育用途。行情可能有延迟，链上工具只读以太坊原生资产；持仓、策略业绩和执行按钮均为模拟。"
          : "Research and education only. Quotes may be delayed. The onchain tool reads native Ethereum balances only. Portfolio positions, strategy performance and execution are simulated."}
      </p>
    </div>
  </section>
}
