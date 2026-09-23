"use client"

import { HeatMap } from "../HeatMap"
import { KLineChart } from "../KLineChart"
import { NewsTicker } from "../NewsTicker"
import { TOP_TICKERS } from "@/lib/mock/market"
import { Globe2 } from "lucide-react"
import { useDash } from "@/lib/dash-store"

export function MarketsView() {
  const { selectSymbol } = useDash()
  return (
    <div className="w-full min-w-0 h-full overflow-y-auto grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-2.5">
      <div className="flex flex-col gap-2.5 min-h-0">
        <div className="surface px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe2 className="h-3.5 w-3.5 text-info" />
              <span className="text-[11px] uppercase tracking-wider text-dim">Global Markets Overview</span>
            </div>
            <span className="chip info">16 assets · Demo</span>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
            {TOP_TICKERS.map((row, i) => {
              const up = row.chg >= 0
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectSymbol(row.sym)}
                  className="surface-raised px-3 py-2 text-left hover:border-[var(--line-2)] transition"
                >
                  <div className="text-[10px] text-ghost font-mono-ui">{row.sym}</div>
                  <div className="tabular text-[15px] font-display font-semibold">
                    {row.px.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  <div className={`tabular text-[11px] font-mono-ui ${up ? "text-up" : "text-down"}`}>
                    {up ? "+" : ""}
                    {row.chg.toFixed(2)}%
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex-[1.4] min-h-[320px]">
          <KLineChart />
        </div>
        <div className="flex-1 min-h-[260px]">
          <HeatMap />
        </div>
      </div>
      <div className="min-h-0">
        <NewsTicker />
      </div>
    </div>
  )
}
