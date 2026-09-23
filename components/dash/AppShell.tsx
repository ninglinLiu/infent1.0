"use client"

import { DashProvider } from "@/lib/dash-store"
import { TopBar } from "./TopBar"
import { LeftRail } from "./LeftRail"
import { ToastLayer } from "./ToastLayer"
import { ViewProvider, useView, type ViewId } from "./view-context"
import { WorkspaceView } from "./views/WorkspaceView"
import { AgentView } from "./views/AgentView"
import { MarketsView } from "./views/MarketsView"
import { DiscoverView } from "./views/DiscoverView"
import { BacktestView } from "./views/BacktestView"
import { RiskView } from "./views/RiskView"
import { JournalView } from "./views/JournalView"
import { SettingsView } from "./views/SettingsView"
import { useT, type DictKey } from "@/lib/i18n"

const VIEW_META: Record<ViewId, { title: DictKey; sub: DictKey; tag: string }> = {
  workspace: { title: "view.workspace.title", sub: "view.workspace.sub", tag: "01" },
  agent:     { title: "view.agent.title",     sub: "view.agent.sub",     tag: "02" },
  markets:   { title: "view.markets.title",   sub: "view.markets.sub",   tag: "03" },
  discover:  { title: "view.discover.title",  sub: "view.discover.sub",  tag: "04" },
  backtest:  { title: "view.backtest.title",  sub: "view.backtest.sub",  tag: "05" },
  risk:      { title: "view.risk.title",      sub: "view.risk.sub",      tag: "06" },
  journal:   { title: "view.journal.title",   sub: "view.journal.sub",   tag: "07" },
  settings:  { title: "view.settings.title",  sub: "view.settings.sub",  tag: "08" },
}

function ViewTitleBar() {
  const { view } = useView()
  const t = useT()
  const meta = VIEW_META[view]
  return (
    <div className="px-4 py-2 border-b border-[var(--line-1)] flex items-center gap-3 bg-[var(--bg-1)]/60">
      <span className="chip info text-[10px]">{meta.tag}</span>
      <div className="leading-tight">
        <div className="font-display font-semibold text-[13.5px]">{t(meta.title)}</div>
        <div className="text-[10.5px] text-ghost">{t(meta.sub)}</div>
      </div>
    </div>
  )
}

function ViewRenderer() {
  const { view } = useView()
  return (
      <div
        key={view}
        data-view={view}
        className="flex-1 min-w-0 min-h-0 flex"
      >
        {view === "workspace" && <WorkspaceView />}
        {view === "agent"     && <AgentView />}
        {view === "markets"   && <MarketsView />}
        {view === "discover"  && <DiscoverView />}
        {view === "backtest"  && <BacktestView />}
        {view === "risk"      && <RiskView />}
        {view === "journal"   && <JournalView />}
        {view === "settings"  && <SettingsView />}
      </div>
  )
}

export function AppShell() {
  return (
    <DashProvider>
      <ViewProvider>
        <div className="h-[100dvh] w-full bg-[var(--bg-0)] text-[var(--fg-0)] flex flex-col overflow-hidden hud-grid">
          <TopBar />
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            <LeftRail />
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <ViewTitleBar />
              <div className="flex-1 min-w-0 min-h-0 p-2.5 flex overflow-auto">
                <ViewRenderer />
              </div>
            </div>
          </div>
          <ToastLayer />
        </div>
      </ViewProvider>
    </DashProvider>
  )
}
