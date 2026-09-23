"use client"

import { useDash } from "@/lib/dash-store"
import { Gauge, Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"

const FACTORS = [
  { label: "Market beta",       v: 0.92, safe: 1.1, danger: 1.4 },
  { label: "Sector concentration", v: 0.48, safe: 0.55, danger: 0.7 },
  { label: "Currency exposure", v: 0.32, safe: 0.5, danger: 0.7 },
  { label: "Liquidity score",   v: 0.88, safe: 0.7, danger: 0.5, higherBetter: true as const },
  { label: "Correlation to SPY",v: 0.76, safe: 0.85, danger: 0.95 },
  { label: "Leverage",          v: 1.0,  safe: 1.5, danger: 2.0 },
]

export function RiskView() {
  const { metrics, holdings } = useDash()

  const totalVaR = metrics.nav * 0.032
  const stress2008 = metrics.nav * -0.28
  const stressCovid = metrics.nav * -0.18

  return (
    <div className="w-full min-w-0 h-full overflow-y-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-2.5 min-h-0">
      <div className="flex flex-col gap-2.5 min-h-0 overflow-y-auto thin-scroll pr-1">
        {/* Risk score gauge */}
        <div className="surface p-5 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative h-40 w-40 shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <defs>
                <linearGradient id="rg" x1="0" x2="1">
                  <stop offset="0%" stopColor="#00ff9f" />
                  <stop offset="50%" stopColor="#ffb547" />
                  <stop offset="100%" stopColor="#ff3b5c" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r="80" stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" />
              <circle
                cx="100" cy="100" r="80"
                stroke="url(#rg)" strokeWidth="14" fill="none"
                strokeLinecap="round"
                strokeDasharray={`${0.42 * 502} 502`}
                transform="rotate(-90 100 100)"
              />
              <text x="100" y="95" textAnchor="middle" fontSize="42" fontWeight="700" fill="#fff" className="font-display">42</text>
              <text x="100" y="120" textAnchor="middle" fontSize="11" fill="#8a93a0">Risk Score</text>
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="h-4 w-4 text-up" />
              <span className="text-[11px] uppercase tracking-wider text-dim">Overall · Balanced</span>
            </div>
            <h3 className="font-display text-2xl font-semibold">
              Your portfolio is{" "}
              <span className="text-up">comfortably within</span> target risk band.
            </h3>
            <p className="text-[13px] text-dim mt-2 leading-relaxed max-w-[520px]">
              Compared with a 60/40 benchmark: better drawdown profile, similar Sharpe. No factor currently in red zone.
              One amber flag on sector concentration — consider trimming AI basis by 2%.
            </p>
          </div>
        </div>

        {/* Factors grid */}
        <div className="surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="h-3.5 w-3.5 text-info" />
            <span className="text-[11px] uppercase tracking-wider text-dim">Risk factor breakdown</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FACTORS.map((f) => {
              const ratio =
                f.higherBetter ? f.v / Math.max(f.safe, f.v) : Math.min(1, f.v / f.danger)
              const safe = f.higherBetter ? f.v >= f.safe : f.v <= f.safe
              const danger = f.higherBetter ? f.v < f.danger : f.v >= f.danger
              const color = danger ? "#ff3b5c" : safe ? "#00ff9f" : "#ffb547"
              return (
                <div key={f.label} className="surface-raised p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-dim">{f.label}</span>
                    <span className="tabular font-mono-ui text-[12px]" style={{ color }}>
                      {f.v.toFixed(2)}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--bg-3)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ratio * 100)}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 18 }}
                      className="h-full"
                      style={{ background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stress tests */}
        <div className="surface p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-3.5 w-3.5 text-down" />
            <span className="text-[11px] uppercase tracking-wider text-dim">Stress scenarios</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <StressCard title="Today VaR (99%)" v={totalVaR} pct={-3.2} note="1-day loss exceeded 1% of the time" />
            <StressCard title="2008 Crisis replay" v={stress2008} pct={-28} note="Replay Oct 2008: -36% SPY, -28% your book" />
            <StressCard title="COVID crash replay" v={stressCovid} pct={-18} note="Replay Mar 2020: -34% SPY, -18% your book" />
          </div>
        </div>
      </div>

      {/* Right column — exposure by asset */}
      <div className="surface flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-[var(--line-1)] flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-info" />
          <span className="text-[11px] uppercase tracking-wider text-dim">Exposure by holding</span>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-1">
          {holdings.map((h) => {
            const hi = h.weight > 0.18
            return (
              <div key={h.symbol} className="px-2 py-2 rounded hover:bg-[var(--bg-3)] transition">
                <div className="flex items-center justify-between">
                  <div className="text-[12.5px] font-mono-ui">
                    {h.symbol} <span className="text-ghost text-[10px]">· {h.name}</span>
                  </div>
                  <div className={`tabular font-mono-ui text-[12px] ${hi ? "text-down" : "text-up"}`}>
                    {Math.round(h.weight * 100)}%
                  </div>
                </div>
                <div className="mt-1 h-1 rounded-full bg-[var(--bg-3)] overflow-hidden">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, h.weight * 100 * 3)}%`,
                      background: hi ? "#ff3b5c" : "#00ff9f",
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StressCard({ title, v, pct, note }: { title: string; v: number; pct: number; note: string }) {
  return (
    <div className="surface-raised p-3">
      <div className="text-[11px] text-dim">{title}</div>
      <div className="tabular mt-1 text-xl font-display font-semibold text-down">
        ${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 0 })}
      </div>
      <div className="text-[11px] font-mono-ui text-down mt-0.5 tabular">{pct}%</div>
      <div className="text-[10px] text-ghost mt-2 leading-snug">{note}</div>
    </div>
  )
}
