"use client"

import { AgentChat } from "../AgentChat"
import { KLineChart } from "../KLineChart"
import { MetricCards } from "../MetricCards"
import { StrategyTimeline } from "../StrategyTimeline"
import { PortfolioPanel } from "../PortfolioPanel"
import { NewsTicker } from "../NewsTicker"
import { HeatMap } from "../HeatMap"

export function AgentView() {
  return (
    <div className="w-full min-w-0 h-full grid grid-cols-1 xl:grid-cols-[minmax(360px,1fr)_1fr] 2xl:grid-cols-[480px_1fr_300px] gap-2.5 min-h-0">
      {/* Left: big chat */}
      <div className="min-h-0">
        <AgentChat />
      </div>

      {/* Center: live reaction */}
      <div className="hidden xl:flex flex-col gap-2.5 min-w-0 min-h-0">
        <MetricCards />
        <div className="flex-[1.4] min-h-[320px]">
          <KLineChart />
        </div>
        <div className="grid grid-cols-2 gap-2.5 flex-1 min-h-[240px]">
          <HeatMap />
          <StrategyTimeline />
        </div>
      </div>

      {/* Right: portfolio + news */}
      <div className="hidden 2xl:grid grid-rows-[1fr_1fr] gap-2.5 min-h-0">
        <PortfolioPanel />
        <NewsTicker />
      </div>
    </div>
  )
}
