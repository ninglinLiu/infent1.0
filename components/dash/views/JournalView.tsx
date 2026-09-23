"use client"

import { useDash } from "@/lib/dash-store"
import { CheckCircle2, Clock, History } from "lucide-react"

export function JournalView() {
  const { marks, activeStrategyId, runs } = useDash()
  const currentRun = runs.find((r) => r.strategy.id === activeStrategyId)

  // Historical mock runs
  const pastRuns = [
    { id: "r1", name: "Balanced Alpha", date: "2025-11-24 10:32", pnl: 1843.2, status: "Completed" },
    { id: "r2", name: "Defensive Shield", date: "2025-11-22 14:08", pnl: -412.7, status: "Completed" },
    { id: "r3", name: "Momentum Burst", date: "2025-11-20 09:54", pnl: 3291.5, status: "Completed" },
    { id: "r4", name: "Value Seeker",   date: "2025-11-17 15:41", pnl: 654.1,  status: "Completed" },
    { id: "r5", name: "Tech Rotation",  date: "2025-11-14 11:20", pnl: 2108.9, status: "Completed" },
  ]

  return (
    <div className="w-full min-w-0 h-full overflow-y-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-2.5 min-h-0">
      <div className="surface flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-[var(--line-1)] flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-info" />
          <span className="text-[11px] uppercase tracking-wider text-dim">Execution journal</span>
          <span className="ml-auto text-[11px] text-dim">
            {pastRuns.length + (activeStrategyId ? 1 : 0)} runs total
          </span>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll">
          <table className="w-full text-[12.5px]">
            <thead className="text-[10px] text-ghost uppercase tracking-wider">
              <tr className="border-b border-[var(--line-1)]">
                <th className="text-left px-4 py-2 font-normal">When</th>
                <th className="text-left px-4 py-2 font-normal">Strategy</th>
                <th className="text-left px-4 py-2 font-normal">Actions</th>
                <th className="text-right px-4 py-2 font-normal">Realised PnL</th>
                <th className="text-right px-4 py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeStrategyId && (
                <tr className="border-b border-[var(--line-1)] bg-[rgba(0,255,159,0.04)]">
                  <td className="px-4 py-3 font-mono-ui text-ghost">NOW</td>
                  <td className="px-4 py-3 font-display font-semibold">{activeStrategyId}</td>
                  <td className="px-4 py-3 text-dim">
                    {currentRun ? `${currentRun.step}/${currentRun.strategy.actions.length} steps` : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-dim tabular">—</td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-info">
                      <Clock className="h-3 w-3 animate-pulse" />
                      Executing
                    </span>
                  </td>
                </tr>
              )}
              {pastRuns.map((r) => (
                <tr key={r.id} className="border-b border-[var(--line-1)] hover:bg-[var(--bg-3)] transition">
                  <td className="px-4 py-3 font-mono-ui text-ghost">{r.date}</td>
                  <td className="px-4 py-3 font-display">{r.name}</td>
                  <td className="px-4 py-3 text-dim">4 steps</td>
                  <td className={`px-4 py-3 text-right tabular font-mono-ui ${r.pnl >= 0 ? "text-up" : "text-down"}`}>
                    {r.pnl >= 0 ? "+" : ""}${r.pnl.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-up">
                      <CheckCircle2 className="h-3 w-3" />
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="surface flex flex-col min-h-0">
        <div className="px-4 py-3 border-b border-[var(--line-1)]">
          <span className="text-[11px] uppercase tracking-wider text-dim">Execution markers on chart</span>
        </div>
        <div className="flex-1 overflow-y-auto thin-scroll p-2 space-y-1.5">
          {marks.length === 0 && (
            <div className="text-center text-[12px] text-ghost py-10 stripes rounded">
              Run a strategy to see execution markers here.
            </div>
          )}
          {marks.map((m) => (
            <div key={m.id} className="surface-raised px-3 py-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-mono-ui text-ghost">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </span>
                <span className={`chip ${m.kind === "buy" ? "up" : "down"}`}>
                  {m.kind.toUpperCase()}
                </span>
              </div>
              <div className="mt-1 font-display font-semibold">{m.symbol}</div>
              <div className="text-dim mt-0.5 tabular font-mono-ui">@ ${m.price.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
