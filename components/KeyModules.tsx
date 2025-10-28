'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { Card } from '@/components/ui/card'
import { HoloCard } from './HoloCard'
import { motion } from 'framer-motion'
import ProjectData from '@/content/project.json'

export function KeyModules() {
  const { language } = useLanguage()
  const [modules, setModules] = useState<any[]>([])

  useEffect(() => {
    setModules(ProjectData.modules[language])
  }, [language])

  return (
    <section id="features" className="py-20 container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12 neon-text-cyan">
        {language === 'zh' ? '核心模块' : 'Key Modules'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module, index) => (
          <motion.div
            key={module.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <HoloCard className="p-6 h-full flex flex-col">
              <h3 className="text-xl font-bold neon-text-cyan mb-3">{module.title}</h3>
              <p className="text-gray-300 flex-grow">{module.description}</p>
            </HoloCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
