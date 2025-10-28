'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import KPIData from '@/content/kpis.json'

export function RiskRadar() {
  const [riskData, setRiskData] = useState<{ name: string; value: number; color: string }[]>([])

  useEffect(() => {
    const data = KPIData.chartData.riskRadar
    setRiskData([
      { name: 'Credit', value: data.credit, color: 'cyan' },
      { name: 'Market', value: data.market, color: 'magenta' },
      { name: 'Liquidity', value: data.liquidity, color: 'purple' },
      { name: 'Fraud', value: data.fraud, color: 'green' },
      { name: 'Operational', value: data.operational, color: 'orange' }
    ])
  }, [])

  return (
    <Card className="border-2 border-cyan-500 shadow-[0_0_30px_rgba(0,255,255,0.3)]">
      <CardContent className="p-8">
        <h3 className="text-2xl font-bold neon-text-cyan mb-6">Risk Radar</h3>
        <div className="space-y-4">
          {riskData.map((risk, index) => (
            <motion.div
              key={risk.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">{risk.name}</span>
                <span className="neon-text-cyan font-bold">{risk.value.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r from-cyan-500 to-magenta-500`}
                  initial={{ width: 0 }}
                  animate={{ width: `${risk.value * 10}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
