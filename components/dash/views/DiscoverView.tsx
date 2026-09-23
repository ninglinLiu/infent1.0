"use client"

import { NEWS_FEED } from "@/lib/mock/market"
import { STRATEGIES } from "@/lib/mock/agent"
import { Bot, Flame, Sparkles, TrendingUp } from "lucide-react"
import Link from "next/link"
import { useDash } from "@/lib/dash-store"
import { useLang, useT } from "@/lib/i18n"

const INSIGHTS = [
  {
    title: "Your portfolio overlaps 73% with Elon Musk's public positions",
    body: "Add 3% TSLA to match his weighting — backtest shows +18% annualised over 24 months.",
    tone: "#00ff9f",
    tag: "Personal Alpha",
  },
  {
    title: "Fed-cut trade set-up: 4 prior cycles averaged +18% for QQQ in 6 months",
    body: "Sell dates show mean max-drawdown -6%, signal confidence 0.72. Strategy card: Balanced Alpha.",
    tone: "#22d3ee",
    tag: "Macro",
  },
  {
    title: "New-energy sector sentiment at 5th-percentile — mean-reversion likely in 30–60 days",
    body: "68% historical probability of +12% rebound. Tactical entry ≤6% of portfolio with -8% stop.",
    tone: "#ff6aa8",
    tag: "Sentiment",
  },
]

export function DiscoverView() {
  const { executeStrategy, activeStrategyId } = useDash()
  const { lang } = useLang()
  const t = useT()
  const topStrats = Object.values(STRATEGIES).slice(0, 3)

  return (
    <div className="w-full min-w-0 h-full overflow-y-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-2.5 min-h-0">
      <div className="flex flex-col gap-2.5 min-h-0 overflow-y-auto thin-scroll pr-1">
        {/* Insight cards */}
        <div className="grid gap-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-up" />
            <span className="text-[11px] uppercase tracking-wider text-dim">Illustrative insights · simulated data</span>
          </div>
          {INSIGHTS.map((ins, i) => (
            <div
              key={i}
              className="surface p-4 flex gap-4 hover:border-[rgba(255,255,255,0.14)] transition"
              style={{ background: `linear-gradient(180deg, ${ins.tone}0d, transparent 70%)` }}
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${ins.tone}22`, border: `1px solid ${ins.tone}55` }}
              >
                <TrendingUp className="h-4 w-4" style={{ color: ins.tone }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="chip" style={{ color: ins.tone, borderColor: `${ins.tone}44` }}>
                    {ins.tag}
                  </span>
                  <span className="text-[10px] text-ghost">Confidence 0.{70 + i * 5}</span>
                </div>
                <div className="font-display text-[15px] font-semibold leading-snug">{ins.title}</div>
                <div className="text-[12.5px] text-dim mt-1 leading-relaxed">{ins.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Trending strategies */}
        <div className="surface p-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flame className="h-3.5 w-3.5 text-up" />
              <span className="text-[11px] uppercase tracking-wider text-dim">Trending strategies · community</span>
            </div>
            <Link href="#" className="text-[11px] text-dim hover:text-white">
              {t("common.seeAll")}
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
            {topStrats.map((s) => (
              <div key={s.id} className="surface-raised p-3">
                <div className="text-[13px] font-display font-semibold leading-snug">
                  {lang === "en" ? s.nameEn : s.name}
                </div>
                <div className="text-[11px] text-dim mt-1 line-clamp-2">
                  {lang === "en" ? s.thesisEn : s.thesis}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-up font-mono-ui text-sm tabular">
                    +{(s.expectedReturn * 100).toFixed(1)}%
                  </span>
                  <button
                    onClick={() => executeStrategy(s.id)}
                    disabled={activeStrategyId === s.id}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-up text-black font-semibold hover:brightness-110 disabled:opacity-60"
                  >
                    {activeStrategyId === s.id ? "Running…" : "Execute"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="surface flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-[var(--line-1)] flex items-center gap-2">
          <Bot className="h-3.5 w-3.5 text-info" />
          <span className="text-[11px] uppercase tracking-wider text-dim">Sentiment feed · real-time</span>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-1">
          {NEWS_FEED.map((n) => {
            const tone =
              n.sentiment === "up" ? "#00ff9f" : n.sentiment === "down" ? "#ff3b5c" : "#8a93a0"
            return (
              <div key={n.id} className="px-2 py-1.5 rounded hover:bg-[var(--bg-3)] transition">
                <div className="flex items-center gap-2 text-[10px] text-ghost">
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: tone }} />
                  <span className="font-mono-ui">{n.time}</span>
                  <span>·</span>
                  <span>{n.src}</span>
                  {n.tag && (
                    <span className="ml-auto chip text-[9px] px-1.5 py-0">
                      {lang === "en" ? n.tagEn ?? n.tag : n.tag}
                    </span>
                  )}
                </div>
                <div className="text-[12.5px] leading-snug mt-0.5" style={{ color: tone }}>
                  {lang === "en" ? n.titleEn : n.title}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
