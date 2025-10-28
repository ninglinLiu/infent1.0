'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useLanguage } from '@/lib/language-context'
import { useEffect, useState } from 'react'

export function Hero() {
  const { language } = useLanguage()
  const [projectData, setProjectData] = useState<any>(null)

  useEffect(() => {
    import('@/content/project.json').then(data => {
      setProjectData(data.default)
    })
  }, [])

  if (!projectData) return null

  return (
    <section className="relative py-32 container mx-auto px-4 text-center overflow-hidden">
      <div className="relative mb-12">
        <h1 className="text-5xl md:text-7xl font-bold mb-4 neon-text-cyan glitch" data-text={projectData.projectTitle[language]}>
          {projectData.projectTitle[language]}
        </h1>
        <div className="h-1 w-64 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent blur-sm"></div>
      </div>
      <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto">
        {language === 'zh' 
          ? '融合机器学习与图神经网络的智能投资顾问与实时风险管理系统' 
          : 'Intelligent investment advisor and real-time risk management system powered by ML and GNN'}
      </p>
      <Button 
        variant="neon" 
        size="lg" 
        className="group"
        onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
      >
        {language === 'zh' ? '探索功能' : 'Explore Features'}
        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
      </Button>
    </section>
  )
}
