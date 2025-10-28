'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { HoloCard } from './HoloCard'
import { motion } from 'framer-motion'
import ProjectData from '@/content/project.json'

export function UseCases() {
  const { language } = useLanguage()
  const [useCases, setUseCases] = useState<any[]>([])

  useEffect(() => {
    setUseCases(ProjectData.useCases[language])
  }, [language])

  return (
    <section className="py-20 container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12 neon-text-magenta">
        {language === 'zh' ? '应用场景' : 'Use Cases'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {useCases.map((useCase, index) => (
          <motion.div
            key={useCase.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <HoloCard className="p-6 h-full">
              <div className="text-4xl mb-4">{useCase.icon}</div>
              <h3 className="text-2xl font-bold neon-text-magenta mb-3">{useCase.title}</h3>
              <p className="text-gray-300">{useCase.description}</p>
            </HoloCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
