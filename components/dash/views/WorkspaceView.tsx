"use client"

import { KLineChart } from "../KLineChart"
import { MetricCards } from "../MetricCards"
import { StrategyTimeline } from "../StrategyTimeline"
import { PortfolioPanel } from "../PortfolioPanel"
import { HeatMap } from "../HeatMap"
import { NewsTicker } from "../NewsTicker"
import { AgentChat } from "../AgentChat"

export function WorkspaceView() {
  return (
    <div className="flex-1 min-w-0 flex flex-col xl:flex-row gap-2.5 min-h-0 overflow-y-auto">
      <div className="xl:flex-1 min-w-0 flex flex-col gap-2.5 shrink-0 xl:min-h-0">
        <MetricCards />
        <div className="flex-[1.4] min-h-[320px]">
          <KLineChart />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 min-h-[220px]">
          <StrategyTimeline />
          <PortfolioPanel />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-2.5 flex-1 min-h-[200px]">
          <HeatMap />
          <NewsTicker />
        </div>
      </div>
      <div className="w-full xl:w-[400px] h-[600px] xl:h-auto shrink-0 flex flex-col min-h-0">
        <AgentChat />
      </div>
    </div>
  )
}
