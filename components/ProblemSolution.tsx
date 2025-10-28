'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'
import { HoloCard } from './HoloCard'
import { motion } from 'framer-motion'
import ProjectData from '@/content/project.json'

export function ProblemSolution() {
  const { language } = useLanguage()
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')

  useEffect(() => {
    setProblem(ProjectData.problem[language])
    setSolution(ProjectData.solution[language])
  }, [language])

  return (
    <section className="py-20 container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12 neon-text-magenta">
        {language === 'zh' ? '痛点与解决方案' : 'Problem & Solution'}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <HoloCard className="p-8 h-full border-red-500/50">
            <h3 className="text-3xl font-bold neon-text-magenta mb-6">
              {language === 'zh' ? '💔 痛点' : '💔 Problem'}
            </h3>
            <p className="text-gray-300 leading-relaxed">{problem}</p>
          </HoloCard>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <HoloCard className="p-8 h-full border-2 border-green-500/50">
            <h3 className="text-3xl font-bold" style={{ color: '#00ff88', textShadow: '0 0 10px currentColor, 0 0 20px currentColor' }}>
              {language === 'zh' ? '✨ 解决方案' : '✨ Solution'}
            </h3>
            <p className="text-gray-300 leading-relaxed mt-6">{solution}</p>
          </HoloCard>
        </motion.div>
      </div>
    </section>
  )
}
