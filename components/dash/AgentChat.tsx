"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Bot, ChevronRight, Send, Sparkles, Square, Star, User2, Zap } from "lucide-react"
import { AnswerText } from "@/components/agent/AnswerText"
import { ToolEvidence } from "@/components/agent/ToolEvidence"
import type { ToolTrace } from "@/lib/ai/tools"
import { QUICK_QUESTIONS, STRATEGIES, type QuickQuestion, type Strategy } from "@/lib/mock/agent"
import { useDash } from "@/lib/dash-store"
import { useLang, type DictKey } from "@/lib/i18n"
import { useChatStream, toParagraphs, type WireMessage } from "@/lib/ai/use-chat-stream"

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | {
      id: string
      role: "assistant"
      paragraphs: string[]
      strategyIds: string[]
      typing?: boolean
      sources?: string[]
      tools?: ToolTrace[]
      strategyMode?: string
      strategyCards?: Array<{ strategyId: string; rationale: string }>
    }

function RiskStars({ risk }: { risk: number }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-2.5 w-2.5 ${
            i <= risk ? "fill-[#ff3b5c] text-[#ff3b5c]" : "text-[var(--fg-3)]"
          }`}
        />
      ))}
    </div>
  )
}

function actionChip(a: { kind: string; symbol: string; qtyPct?: number; target?: number }, t: (k: DictKey) => string) {
  if (a.kind === "buy") return `${t("agent.action.buy")} ${a.symbol} +${Math.round((a.qtyPct ?? 0) * 100)}%`
  if (a.kind === "sell") return `${t("agent.action.sell")} ${a.symbol} -${Math.round((a.qtyPct ?? 0) * 100)}%`
  if (a.kind === "alloc") return `${a.symbol} → ${Math.round((a.target ?? 0) * 100)}%`
  if (a.kind === "hold") return `${t("agent.action.hold")} ${a.symbol}`
  return ""
}

function StrategyCard({ strategy, rationale }: { strategy: Strategy; rationale?: string }) {
  const { executeStrategy, activeStrategyId } = useDash()
  const { lang, t } = useLang()
  const busy = activeStrategyId === strategy.id
  const [expanded, setExpanded] = useState(false)
  const name = lang === "en" ? strategy.nameEn : strategy.name
  const thesis = lang === "en" ? strategy.thesisEn : strategy.thesis
  const horizon = lang === "en" ? strategy.horizonEn : strategy.horizon
  const tags = lang === "en" ? strategy.tagsEn : strategy.tags
  const narrative = lang === "en" ? strategy.narrativeEn : strategy.narrative

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-raised relative overflow-hidden"
    >
      <div className="p-3 space-y-2">
        <div className="text-[10px] text-ghost">{lang === 'zh' ? '教学模拟卡 · 下列业绩数字为示例，非实测或承诺' : 'Educational simulation · performance figures are illustrative, not measured or promised'}</div>
        {rationale && <AnswerText text={rationale} />}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display text-sm font-semibold truncate">{name}</span>
              <RiskStars risk={strategy.risk} />
            </div>
            <div className="text-[11px] text-dim mt-0.5 leading-snug">{thesis}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[9px] text-ghost uppercase tracking-wider">{t("agent.expReturn")}</div>
            <div className="text-up font-mono-ui text-base tabular">
              +{(strategy.expectedReturn * 100).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <div className="rounded border border-[var(--line-1)] bg-[var(--bg-2)] px-2 py-1">
            <div className="text-[9px] text-ghost">{t("agent.horizon")}</div>
            <div className="text-[11px] tabular">{horizon}</div>
          </div>
          <div className="rounded border border-[var(--line-1)] bg-[var(--bg-2)] px-2 py-1">
            <div className="text-[9px] text-ghost">{t("agent.winRate")}</div>
            <div className="text-[11px] tabular text-up">{(strategy.winRate * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded border border-[var(--line-1)] bg-[var(--bg-2)] px-2 py-1">
            <div className="text-[9px] text-ghost">{t("agent.drawdown")}</div>
            <div className="text-[11px] tabular text-down">{(strategy.drawdown * 100).toFixed(1)}%</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {strategy.actions.map((a, i) => {
            const toneCls =
              a.kind === "buy"
                ? "chip up"
                : a.kind === "sell"
                  ? "chip down"
                  : "chip info"
            return (
              <span key={i} className={toneCls}>
                {actionChip(a as any, t)}
              </span>
            )
          })}
        </div>

        {expanded && (
          <motion.ol
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="text-[11px] text-dim space-y-1 pl-4 list-decimal"
          >
            {narrative.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </motion.ol>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => executeStrategy(strategy.id)}
            disabled={busy}
            className={`group relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
              busy
                ? "bg-[var(--bg-3)] text-dim cursor-wait"
                : "bg-up text-black hover:brightness-110 ring-up"
            }`}
          >
            {busy ? (
              <>
                <div className="h-3 w-3 rounded-full border-2 border-black/40 border-t-black animate-spin" />
                {t("agent.executing")}
              </>
            ) : (
              <>
                <Zap className="h-3 w-3" />
                {t("agent.exec")}
              </>
            )}
          </button>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[11px] text-dim hover:text-[var(--fg-0)] transition flex items-center gap-0.5"
          >
            {expanded ? t("agent.hideReason") : t("agent.showReason")}
            <ChevronRight className={`h-3 w-3 transition ${expanded ? "rotate-90" : ""}`} />
          </button>
          <div className="ml-auto text-[10px] text-ghost">
            {tags.map((tag, i) => (
              <span key={i} className="ml-1.5">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AssistantBubble({ m }: { m: Extract<ChatMessage, { role: "assistant" }> }) {
  const { t } = useLang()
  const [revealed, setRevealed] = useState(m.typing ? 0 : m.paragraphs.length)
  useEffect(() => {
    if (!m.typing) return
    let i = 0
    setRevealed(0)
    const id = setInterval(() => {
      i += 1
      setRevealed(i)
      if (i >= m.paragraphs.length) clearInterval(id)
    }, 650)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m.id])

  // 流式模式下 paragraphs 会随 token 持续增长。
  // 非打字模式必须跟随长度变化，否则只会停留在首次渲染时的段数。
  useEffect(() => {
    if (m.typing) return
    setRevealed(m.paragraphs.length)
  }, [m.typing, m.paragraphs.length])

  return (
    <div className="flex gap-2">
      <div className="shrink-0 mt-0.5">
        <div className="relative h-7 w-7 rounded-md surface-raised flex items-center justify-center ai-pulse">
          <Bot className="h-3.5 w-3.5 text-info" />
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold">{t("agent.name")}</span>
          <span className="chip info text-[9px] px-1.5 py-0">
            <Sparkles className="h-2 w-2" /> Research Agent
          </span>
        </div>
        <div className="space-y-1.5">
          {m.paragraphs.slice(0, revealed).map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[13px] leading-relaxed text-[var(--fg-1)]"
            ><AnswerText text={p} /></motion.div>
          ))}
          {(revealed < m.paragraphs.length || m.paragraphs.every((p) => !p)) && (
            <div className="flex gap-1 pt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-info animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-info animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-info animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>

        <ToolEvidence tools={m.tools} />
        {m.strategyMode === 'fallback' && <div className="text-[10px] text-ghost">{t('agent.fallback')}</div>}
        {m.sources && m.sources.length > 0 && (
          <div className="text-[10px] text-ghost border-t border-[var(--line-1)] pt-1.5 mt-1">
            {t("agent.sources")}：{m.sources.join(" · ")}
          </div>
        )}

        {revealed >= m.paragraphs.length && m.strategyIds.length > 0 && (
          <div className="space-y-2 pt-1">
            {m.strategyIds.map((sid) => {
              const s = STRATEGIES[sid]
              if (!s) return null
              return <StrategyCard key={sid} strategy={s} rationale={m.strategyCards?.find(card => card.strategyId === sid)?.rationale} />
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-2 justify-end">
      <div className="max-w-[85%] rounded-md rounded-br-sm px-3 py-2 text-[13px] bg-[var(--bg-3)] border border-[var(--line-2)]">
        {text}
      </div>
      <div className="shrink-0 mt-0.5">
        <div className="h-7 w-7 rounded-md bg-[var(--bg-3)] border border-[var(--line-2)] flex items-center justify-center">
          <User2 className="h-3.5 w-3.5 text-dim" />
        </div>
      </div>
    </div>
  )
}

export function AgentChat() {
  const { lang, t } = useLang()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { send, stop } = useChatStream()

  useEffect(() => {
    setMessages([
      {
        id: `intro-${lang}`,
        role: "assistant",
        paragraphs: [t("agent.intro.p1"), t("agent.intro.p2")],
        strategyIds: [],
      },
    ])
  }, [lang, t])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  /**
   * 统一的提问入口：接 /api/chat 流式返回。
   * 策略卡不再写死在快捷问题里，而是由服务端确定性匹配后随元数据返回，
   * 这样自由输入的问题也能拿到策略卡。
   */
  async function askModel(prompt: string) {
    const text = prompt.trim()
    if (!text || busy) return

    const userId = `u-${Date.now()}`
    const aiId = `a-${Date.now() + 1}`

    // 组装历史：intro 那条是本地问候语，不发给模型
    const history: WireMessage[] = [
      ...messages
        .filter((m) => !m.id.startsWith("intro-"))
        .map((m): WireMessage =>
          m.role === "user"
            ? { role: "user", content: m.text }
            : { role: "assistant", content: m.paragraphs.join("\n\n") }
        ),
      { role: "user", content: text },
    ]

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", text },
      { id: aiId, role: "assistant", paragraphs: [""], strategyIds: [] },
    ])
    setBusy(true)

    await send(history, {
      lang: lang === "en" ? "en" : "zh",
      surface: lang === "en" ? "the Agent console of the dashboard" : "仪表盘的 Agent 控制台",
      onText: (partial) => {
        const paras = toParagraphs(partial)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId && m.role === "assistant" ? { ...m, paragraphs: paras } : m
          )
        )
      },
      onDone: (final, meta) => {
        const paras = toParagraphs(final)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiId && m.role === "assistant"
              ? {
                  ...m,
                  paragraphs: paras,
                  strategyIds: meta?.strategyIds ?? [],
                  sources: meta?.sources ?? [],
                  tools: meta?.tools ?? [],
                  strategyMode: meta?.strategyMode,
                  strategyCards: meta?.strategyCards,
                }
              : m
          )
        )
        setBusy(false)
      },
      onError: () => setBusy(false),
    })
  }

  function ask(q: QuickQuestion) {
    void askModel(lang === "en" ? q.promptEn : q.prompt)
  }

  function onSend() {
    const text = input.trim()
    if (!text) return
    setInput("")
    void askModel(text)
  }

  return (
    <div className="surface h-full flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--line-1)] flex items-center justify-between bg-[var(--bg-2)]">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 rounded-md surface-raised flex items-center justify-center ai-pulse">
            <Bot className="h-4 w-4 text-info" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm">{t("agent.name")}</span>
              <span className="chip up text-[9px] px-1.5 py-0">
                <span className="h-1 w-1 rounded-full bg-up animate-pulse" /> {t("agent.online")}
              </span>
            </div>
            <div className="text-[10px] text-ghost">{t("agent.subtitle")}</div>
          </div>
        </div>
        <span className="chip info">
          <Sparkles className="h-2.5 w-2.5" /> Alpha Copilot
        </span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto thin-scroll px-3 py-3 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((m) =>
            m.role === "user" ? (
              <UserBubble key={m.id} text={m.text} />
            ) : (
              <AssistantBubble key={m.id} m={m} />
            )
          )}
        </AnimatePresence>
      </div>

      <div className="px-3 py-2 border-t border-[var(--line-1)] bg-[var(--bg-1)]">
        <div className="flex items-center gap-1.5 text-[10px] text-ghost mb-1.5">
          <Sparkles className="h-3 w-3 text-info" />
          {t("agent.quickHint")}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q.id}
              disabled={busy}
              onClick={() => ask(q)}
              className="text-[11px] px-2 py-1 rounded-full border border-[var(--line-2)] bg-[var(--bg-2)] hover:border-[rgba(88,199,255,0.45)] hover:text-info hover:bg-[var(--info-soft)] disabled:opacity-50 transition"
            >
              {lang === "en" ? q.labelEn : q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-3 py-2.5 border-t border-[var(--line-1)] bg-[var(--bg-2)] flex items-center gap-2">
        <input
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              onSend()
            }
          }}
          placeholder={t("agent.placeholder")}
          aria-label={t('agent.placeholder')}
          maxLength={4000}
          className="min-w-0 flex-1 bg-[var(--bg-1)] border border-[var(--line-2)] rounded-md px-3 py-2 text-base sm:text-[13px] placeholder:text-[var(--fg-3)] focus:outline-none focus:border-[rgba(0,255,159,0.45)] focus:ring-up"
        />
        <button
          onClick={busy ? stop : onSend}
          disabled={!busy && !input.trim()}
          className="h-9 px-3 rounded-md bg-up text-black font-semibold text-[12px] flex items-center gap-1 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {busy ? <Square className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
          {busy ? t('agent.stop') : t("agent.send")}
        </button>
      </div>
    </div>
  )
}
