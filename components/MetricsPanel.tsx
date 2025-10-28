'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import KPIData from '@/content/kpis.json'

interface MetricCardProps {
  label: string
  value: number
  unit: string
  trend: string
  color: 'cyan' | 'magenta' | 'purple'
}

function MetricCard({ label, value, unit, trend, color }: MetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1500
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(current)
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  const colorClasses = {
    cyan: 'border-cyan-500 text-cyan-400 shadow-[0_0_20px_rgba(0,255,255,0.3)]',
    magenta: 'border-magenta-500 text-magenta-400 shadow-[0_0_20px_rgba(255,0,255,0.3)]',
    purple: 'border-purple-500 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`border-2 ${colorClasses[color]}`}>
        <CardContent className="p-6">
          <div className="text-sm text-gray-400 mb-2">{label}</div>
          <div className="text-3xl font-bold mb-1">
            {displayValue.toFixed(1)}{unit}
          </div>
          <div className={`text-sm ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function MetricsPanel() {
  const { language } = useLanguage()
  const [metrics, setMetrics] = useState<any[]>([])

  useEffect(() => {
    const data = KPIData.metrics
    setMetrics(Object.entries(data).map(([key, value]: [string, any]) => ({
      key,
      ...value,
      label: value.label[language]
    })))
  }, [language])

  return (
    <section id="metrics" className="py-20 container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12 neon-text-cyan">
        {language === 'zh' ? '实时指标看板' : 'Real-time Metrics'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={metric.key}
            label={metric.label}
            value={metric.value}
            unit={metric.unit}
            trend={metric.trend}
            color={metric.color}
          />
        ))}
      </div>
    </section>
  )
}
