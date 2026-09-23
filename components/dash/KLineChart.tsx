"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  LineStyle,
  createChart,
  createSeriesMarkers,
} from "lightweight-charts"
import type {
  CandlestickData,
  HistogramData,
  IChartApi,
  ISeriesApi,
  ISeriesMarkersPluginApi,
  LineData,
  MouseEventParams,
  Time,
} from "lightweight-charts"
import { ArrowDown, ArrowUp, Loader2, Maximize2, Minimize2, Search, Sparkles } from "lucide-react"
import { useDash } from "@/lib/dash-store"
import { useLang, useT } from "@/lib/i18n"
import { PRESET_LIST, displayName, filterPresets, tradingViewUrl } from "@/lib/market/presets"
import type { ChartInterval, Instrument, KlinePayload } from "@/lib/market/types"
import { INTERVALS } from "@/lib/market/types"
import { VIEW_BARS, buildForecast, markIndex, visibleFrom } from "@/lib/market/overlay"

type HoverBar = {
  time: Time
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

type ChartApi = {
  chart: IChartApi
  candles: ISeriesApi<"Candlestick">
  volume: ISeriesApi<"Histogram">
  forecast: ISeriesApi<"Line">
  bandUpper: ISeriesApi<"Line">
  bandLower: ISeriesApi<"Line">
  markers: ISeriesMarkersPluginApi<Time>
}

function fmtPrice(n: number, precision: number) {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  })
}

function fmtVol(v: number) {
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return `${Math.round(v)}`
}

function fmtTime(time: Time, lang: "zh" | "en") {
  if (typeof time === "string") return time
  if (typeof time === "object") {
    const m = String(time.month).padStart(2, "0")
    const d = String(time.day).padStart(2, "0")
    return `${time.year}-${m}-${d}`
  }
  return new Intl.DateTimeFormat(lang === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(time * 1000))
}

function paintChart(api: ChartApi, payload: KlinePayload, interval: ChartInterval) {
  const candleData: CandlestickData<Time>[] = payload.candles.map((c) => ({
    time: c.time as Time,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }))
  const volumeData: HistogramData<Time>[] = payload.candles.map((c) => ({
    time: c.time as Time,
    value: c.volume,
    color: c.close >= c.open ? "rgba(0,255,159,0.4)" : "rgba(255,59,92,0.4)",
  }))
  api.candles.setData(candleData)
  api.volume.setData(volumeData)

  const last = payload.candles[payload.candles.length - 1]
  if (last) {
    const band = buildForecast(last, interval)
    const start: LineData<Time> = { time: last.time as Time, value: last.close }
    api.forecast.setData([start, ...band.map((b) => ({ time: b.time as Time, value: b.mid }))])
    api.bandUpper.setData([start, ...band.map((b) => ({ time: b.time as Time, value: b.upper }))])
    api.bandLower.setData([start, ...band.map((b) => ({ time: b.time as Time, value: b.lower }))])
  } else {
    api.forecast.setData([])
    api.bandUpper.setData([])
    api.bandLower.setData([])
  }

  const range = visibleFrom(payload.candles.length)
  api.chart.timeScale().setVisibleLogicalRange(range)
}

function paintMarks(
  api: ChartApi,
  payload: KlinePayload,
  marks: { kind: "buy" | "sell"; symbol: string; label: string; idxRatio: number }[],
  currentSymbol: string
) {
  const bars = payload.candles
  if (!bars.length) {
    api.markers.setMarkers([])
    return
  }
  const window = Math.min(VIEW_BARS, bars.length)
  const offset = bars.length - window
  api.markers.setMarkers(
    marks.map((m) => {
      const idx = markIndex(m.idxRatio, window, offset)
      const bar = bars[idx] ?? bars[bars.length - 1]
      const current = m.symbol.toUpperCase() === currentSymbol.toUpperCase()
      return {
        time: bar.time as Time,
        position: m.kind === "buy" ? "belowBar" : "aboveBar",
        color: m.kind === "buy" ? "#00ff9f" : "#ff3b5c",
        shape: m.kind === "buy" ? "arrowUp" : "arrowDown",
        text: m.label,
        size: current ? 2 : 1,
      }
    })
  )
}

export function KLineChart() {
  const {
    marks,
    metrics,
    theme,
    chartInstrument,
    chartInterval,
    setChartInstrument,
    setChartInterval,
  } = useDash()
  const { lang } = useLang()
  const t = useT()

  const [query, setQuery] = useState(chartInstrument.symbol)
  const [searchOpen, setSearchOpen] = useState(false)
  const [results, setResults] = useState<Instrument[]>(PRESET_LIST.slice(0, 8))
  const [payload, setPayload] = useState<KlinePayload | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle")
  const [error, setError] = useState("")
  const [hover, setHover] = useState<HoverBar | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [reload, setReload] = useState(0)
  const [chartTick, setChartTick] = useState(0)

  const searchWrap = useRef<HTMLDivElement>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<ChartApi | null>(null)

  useEffect(() => {
    setQuery(chartInstrument.symbol)
    setHover(null)
  }, [chartInstrument.symbol])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!searchWrap.current?.contains(e.target as Node)) setSearchOpen(false)
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [])

  useEffect(() => {
    if (!searchOpen) return
    const q = query.trim()
    if (!q || q.toUpperCase() === chartInstrument.symbol.toUpperCase()) {
      setResults(filterPresets(q, 8))
      return
    }
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(q)}`)
        const json = (await res.json()) as { items?: Instrument[] }
        setResults(json.items?.length ? json.items : filterPresets(q, 8))
      } catch {
        setResults(filterPresets(q, 8))
      }
    }, 280)
    return () => window.clearTimeout(handle)
  }, [query, searchOpen, chartInstrument.symbol])

  useEffect(() => {
    const ac = new AbortController()
    setStatus("loading")
    setError("")
    const params = new URLSearchParams({
      symbol: chartInstrument.symbol,
      interval: chartInterval,
    })
    if (chartInstrument.secid) params.set("secid", chartInstrument.secid)
    if (chartInstrument.yahoo) params.set("yahoo", chartInstrument.yahoo)
    if (chartInstrument.market) params.set("market", chartInstrument.market)
    if (chartInstrument.name) params.set("name", chartInstrument.name)
    if (chartInstrument.nameEn) params.set("nameEn", chartInstrument.nameEn)
    if (chartInstrument.tv) params.set("tv", chartInstrument.tv)
    if (chartInstrument.timeZone) params.set("tz", chartInstrument.timeZone)

    fetch(`/api/market/klines?${params.toString()}`, { signal: ac.signal })
      .then(async (res) => {
        const json = await res.json()
        if (!res.ok || json.error) throw new Error(json.error || `HTTP ${res.status}`)
        return json as KlinePayload
      })
      .then((data) => {
        setPayload(data)
        setStatus("idle")
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === "AbortError") return
        setStatus("error")
        setError(e instanceof Error ? e.message : "failed")
      })

    return () => ac.abort()
  }, [chartInstrument, chartInterval, reload])

  const dark = theme === "dark"

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    let disposed = false

    const boot = () => {
      if (disposed || chartRef.current) return
      if (el.clientWidth < 48 || el.clientHeight < 80) return

      const chart = createChart(el, {
        autoSize: true,
        layout: {
          background: { type: ColorType.Solid, color: "transparent" },
          textColor: dark ? "#8a93a0" : "#47536b",
          fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace',
        },
        grid: {
          vertLines: { color: dark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.06)" },
          horzLines: { color: dark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.06)" },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: { color: "#58c7ff", width: 1, style: LineStyle.Dashed, labelBackgroundColor: dark ? "#151820" : "#e7ebf0" },
          horzLine: { color: "#58c7ff", width: 1, style: LineStyle.Dashed, labelBackgroundColor: dark ? "#151820" : "#e7ebf0" },
        },
        rightPriceScale: {
          borderColor: dark ? "#242a36" : "#ced3db",
          scaleMargins: { top: 0.1, bottom: 0.22 },
        },
        timeScale: {
          borderColor: dark ? "#242a36" : "#ced3db",
          timeVisible: chartInterval !== "D",
          secondsVisible: false,
          rightOffset: 6,
          barSpacing: 9,
          minBarSpacing: 4,
        },
        localization: { locale: lang === "zh" ? "zh-CN" : "en-US" },
      })

      const candles = chart.addSeries(CandlestickSeries, {
        upColor: "#00ff9f",
        downColor: "#ff3b5c",
        borderVisible: false,
        wickUpColor: "#00ff9f",
        wickDownColor: "#ff3b5c",
      })
      const volume = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
      })
      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
        visible: false,
      })
      const forecast = chart.addSeries(LineSeries, {
        color: "#58c7ff",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      })
      const bandUpper = chart.addSeries(LineSeries, {
        color: "rgba(0,255,159,0.45)",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      })
      const bandLower = chart.addSeries(LineSeries, {
        color: "rgba(0,255,159,0.45)",
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        lastValueVisible: false,
        priceLineVisible: false,
        crosshairMarkerVisible: false,
      })
      const markers = createSeriesMarkers(candles, [])

      const onMove = (param: MouseEventParams<Time>) => {
        if (param.time === undefined) {
          setHover(null)
          return
        }
        const bar = param.seriesData.get(candles) as CandlestickData<Time> | undefined
        const vol = param.seriesData.get(volume) as HistogramData<Time> | undefined
        if (!bar || !("open" in bar)) {
          setHover(null)
          return
        }
        setHover({
          time: param.time,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: vol && "value" in vol ? vol.value : undefined,
        })
      }
      chart.subscribeCrosshairMove(onMove)
      chartRef.current = { chart, candles, volume, forecast, bandUpper, bandLower, markers }
      setChartTick((n) => n + 1)

      return () => {
        chart.unsubscribeCrosshairMove(onMove)
      }
    }

    let unsubMove: (() => void) | undefined
    const tryBoot = () => {
      const cleanup = boot()
      if (cleanup) unsubMove = cleanup
    }
    tryBoot()
    const ro = new ResizeObserver(() => {
      tryBoot()
      const api = chartRef.current
      if (api && api.chart.timeScale().getVisibleLogicalRange() == null) {
        const n = api.candles.data().length
        if (n) api.chart.timeScale().setVisibleLogicalRange(visibleFrom(n))
      }
    })
    ro.observe(el)

    return () => {
      disposed = true
      ro.disconnect()
      unsubMove?.()
      chartRef.current?.chart.remove()
      chartRef.current = null
    }
  }, [dark, lang, chartInterval])

  useEffect(() => {
    const api = chartRef.current
    if (!api || !payload || payload.interval !== chartInterval) return
    paintChart(api, payload, chartInterval)
    paintMarks(api, payload, marks, chartInstrument.symbol)
  }, [payload, chartInterval, chartTick, marks, chartInstrument.symbol])

  const pick = useCallback(
    (inst: Instrument) => {
      setChartInstrument(inst)
      setQuery(inst.symbol)
      setSearchOpen(false)
    },
    [setChartInstrument]
  )

  const live =
    payload &&
    (payload.instrument.symbol.toUpperCase() === chartInstrument.symbol.toUpperCase() ||
      (!!chartInstrument.yahoo && payload.instrument.yahoo === chartInstrument.yahoo))
      ? payload
      : null
  const quote = live?.quote
  const precision = live?.precision ?? 2
  const shown = useMemo(() => hover ?? (quote
    ? {
        time: (payload?.candles.at(-1)?.time ?? "") as Time,
        open: quote.price,
        high: quote.high ?? quote.price,
        low: quote.low ?? quote.price,
        close: quote.price,
        volume: quote.volume,
      }
    : null), [hover, quote, payload])
  const chg = quote?.change ?? 0
  const chgPct = quote?.changePct ?? 0
  const up = chg >= 0

  const ohlc = useMemo(() => {
    if (!shown || !payload) return null
    const ref = hover ? shown.open : quote?.previous ?? shown.open
    return {
      o: shown.open,
      h: shown.high,
      l: shown.low,
      c: shown.close,
      v: shown.volume,
      t: shown.time,
      up: shown.close >= (hover ? shown.open : ref),
    }
  }, [shown, payload, hover, quote])

  return (
    <div
      className={`relative surface hud-frame overflow-hidden flex flex-col ${
        expanded ? "fixed inset-3 z-[80] h-auto" : "h-full min-h-[360px]"
      }`}
    >
      <div className="relative z-20 shrink-0 bg-[var(--bg-2)] px-4 pt-3 pb-2 border-b border-[var(--line-1)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div ref={searchWrap} className="relative shrink-0">
              <div className="flex items-center gap-1.5 surface-raised px-2 py-1">
                <Search className="h-3 w-3 text-ghost shrink-0" />
                <input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setSearchOpen(true)
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && results[0]) pick(results[0])
                    if (e.key === "Escape") setSearchOpen(false)
                  }}
                  placeholder={t("kline.search.ph")}
                  className="bg-transparent outline-none text-[12px] w-[132px] font-mono-ui"
                  aria-label={t("kline.search")}
                />
              </div>
              {searchOpen && (
                <div className="absolute left-0 top-full mt-1 z-30 w-[320px] max-h-[280px] overflow-y-auto thin-scroll surface-raised shadow-lg">
                  <div className="px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-ghost">
                    {t("kline.popular")}
                  </div>
                  {results.length === 0 && (
                    <div className="px-3 py-4 text-[12px] text-ghost">{t("kline.empty")}</div>
                  )}
                  {results.map((inst) => (
                    <button
                      key={`${inst.secid || inst.yahoo || inst.symbol}`}
                      type="button"
                      onClick={() => pick(inst)}
                      className="w-full text-left px-3 py-2 hover:bg-[var(--bg-4)] flex items-center justify-between gap-2"
                    >
                      <span>
                        <span className="font-mono-ui text-[12px]">{inst.symbol}</span>
                        <span className="ml-2 text-[11px] text-dim">{displayName(inst, lang)}</span>
                      </span>
                      <span className="text-[10px] text-ghost font-mono-ui">{inst.market}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2">
                <span className="font-display text-[15px] font-semibold tracking-wide">
                  {chartInstrument.symbol}
                </span>
                <span className="text-[11px] text-dim truncate">
                  {displayName(chartInstrument, lang)} · {chartInstrument.market || "—"}
                </span>
                <span className="chip info shrink-0">
                  <Sparkles className="h-2.5 w-2.5" /> {t("kline.live")}
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="tabular text-2xl font-display font-semibold">
                  {quote ? fmtPrice(quote.price, precision) : "—"}
                </span>
                {quote && (
                  <span className={`tabular text-sm font-mono-ui ${up ? "text-up" : "text-down"}`}>
                    {up ? "+" : ""}
                    {fmtPrice(chg, precision)} ({up ? "+" : ""}
                    {chgPct.toFixed(2)}%)
                  </span>
                )}
                <span className="text-[10px] text-ghost">
                  {INTERVALS.find((i) => i.id === chartInterval)?.label} · {payload?.candles.length ?? 0} {t("kline.bars")}
                  {payload ? ` · ${payload.source === "eastmoney" ? t("kline.source.eastmoney") : t("kline.source.yahoo")}` : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {INTERVALS.map((tf) => (
              <button
                key={tf.id}
                type="button"
                onClick={() => setChartInterval(tf.id)}
                className={`px-2 py-1 text-[11px] rounded border ${
                  tf.id === chartInterval
                    ? "bg-[var(--bg-3)] text-up border-[rgba(0,255,159,0.3)]"
                    : "text-dim border-transparent hover:border-[var(--line-2)]"
                }`}
              >
                {tf.label}
              </button>
            ))}
            <a
              href={tradingViewUrl(chartInstrument)}
              target="_blank"
              rel="noreferrer"
              className="ml-1 px-2 py-1 text-[11px] rounded border border-transparent hover:border-[var(--line-2)] text-dim"
              title={t("kline.tv")}
            >
              TV
            </a>
            <button
              type="button"
              className="p-1.5 rounded border border-transparent hover:border-[var(--line-2)] text-dim"
              title={expanded ? t("kline.exitfs") : t("kline.fullscreen")}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-0 flex-1 min-h-[280px]">
        <div ref={hostRef} className="absolute inset-0" />

        {status === "loading" && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 chip info z-10">
            <Loader2 className="h-3 w-3 animate-spin" /> {t("kline.loading")}
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 grid place-items-center z-10 bg-[var(--bg-2)]/70">
            <div className="text-center space-y-2">
              <div className="text-sm text-dim">{t("kline.error")}</div>
              <div className="text-[11px] text-ghost font-mono-ui max-w-sm">{error}</div>
              <button type="button" className="chip info" onClick={() => setReload((n) => n + 1)}>
                {t("kline.retry")}
              </button>
            </div>
          </div>
        )}

        {ohlc && payload && (
          <div className="absolute top-2 right-2 surface-raised px-2.5 py-1.5 text-[10px] space-y-0.5 pointer-events-none z-10">
            <div className="text-ghost">{fmtTime(ohlc.t, lang)}</div>
            <div className="flex justify-between gap-4 text-dim">
              <span>O</span>
              <span className="tabular text-[var(--fg-0)]">{fmtPrice(ohlc.o, precision)}</span>
            </div>
            <div className="flex justify-between gap-4 text-dim">
              <span>H</span>
              <span className="tabular text-up">{fmtPrice(ohlc.h, precision)}</span>
            </div>
            <div className="flex justify-between gap-4 text-dim">
              <span>L</span>
              <span className="tabular text-down">{fmtPrice(ohlc.l, precision)}</span>
            </div>
            <div className="flex justify-between gap-4 text-dim">
              <span>C</span>
              <span className={`tabular ${ohlc.up ? "text-up" : "text-down"}`}>{fmtPrice(ohlc.c, precision)}</span>
            </div>
            {ohlc.v != null && (
              <div className="flex justify-between gap-4 text-dim">
                <span>VOL</span>
                <span className="tabular text-[var(--fg-0)]">{fmtVol(ohlc.v)}</span>
              </div>
            )}
            <div className="flex justify-between gap-4 text-dim">
              <span>{t("kline.ai.win")}</span>
              <span className="tabular text-info">{Math.round(metrics.winRate * 100)}%</span>
            </div>
          </div>
        )}
      </div>

      {marks.length > 0 && (
        <div className="relative z-10 shrink-0 px-4 py-1.5 border-t border-[var(--line-1)] flex items-center gap-2 overflow-x-auto thin-scroll">
          <span className="text-[10px] text-ghost uppercase tracking-wider shrink-0">{t("kline.exec.title")}</span>
          {marks.map((m) => (
            <span key={m.id} className={`chip shrink-0 ${m.kind === "buy" ? "up" : "down"}`}>
              {m.kind === "buy" ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
              {m.label}
            </span>
          ))}
        </div>
      )}

      <div className="relative z-10 shrink-0 flex items-center justify-between gap-3 px-4 py-1.5 text-[10px] border-t border-[var(--line-1)] bg-[var(--bg-2)]">
        <div className="flex gap-4">
          <span className="inline-flex items-center gap-1 text-dim">
            <span className="inline-block w-3 h-1.5 bg-up rounded-sm" /> {t("kline.legend.history")}
          </span>
          <span className="inline-flex items-center gap-1 text-dim">
            <span className="inline-block w-3 h-1.5 rounded-sm" style={{ background: "#58c7ff" }} /> {t("kline.legend.forecast")}
          </span>
          <span className="inline-flex items-center gap-1 text-dim">
            <ArrowUp className="h-2.5 w-2.5 text-up" /> {t("kline.legend.buy")}
            <ArrowDown className="h-2.5 w-2.5 text-down ml-2" /> {t("kline.legend.sell")}
          </span>
        </div>
        <a
          href="https://www.tradingview.com/"
          target="_blank"
          rel="noreferrer"
          className="text-ghost hover:text-dim"
        >
          {t("kline.attribution")}
        </a>
      </div>
    </div>
  )
}
