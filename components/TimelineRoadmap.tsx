'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { Card } from '@/components/ui/card'
import { motion } from 'framer-motion'
import ProjectData from '@/content/project.json'

export function TimelineRoadmap() {
  const { language } = useLanguage()
  const [phases, setPhases] = useState<any[]>([])

  useEffect(() => {
    setPhases(ProjectData.roadmap[language])
  }, [language])

  return (
    <section className="py-20 container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12 neon-text-magenta">
        {language === 'zh' ? '产品路线图' : 'Product Roadmap'}
      </h2>
      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-500 via-magenta-500 to-purple-500 transform -translate-x-1/2 hidden md:block"></div>
        <div className="space-y-8">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.phase}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
            >
              <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                <Card className="border-2 border-magenta-500 shadow-[0_0_20px_rgba(255,0,255,0.3)] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold neon-text-magenta">{phase.phase}</h3>
                    <span className="text-sm text-gray-400">{phase.date}</span>
                  </div>
                  <ul className="space-y-2">
                    {phase.milestones.map((milestone: string, i: number) => (
                      <li key={i} className="text-gray-300 flex items-center">
                        <span className="w-2 h-2 bg-magenta-500 rounded-full mr-2"></span>
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
