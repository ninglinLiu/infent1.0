'use client'

import { Hero } from '@/components/Hero'
import { ArchitectureScene } from '@/components/ArchitectureScene'
import { ProblemSolution } from '@/components/ProblemSolution'
import { KeyModules } from '@/components/KeyModules'
import { MetricsPanel } from '@/components/MetricsPanel'
import { RiskRadar } from '@/components/RiskRadar'
import { UseCases } from '@/components/UseCases'
import { TimelineRoadmap } from '@/components/TimelineRoadmap'
import { FAQ } from '@/components/FAQ'
import { ContactForm } from '@/components/ContactForm'
import { FooterCRT } from '@/components/FooterCRT'
import { useLanguage } from '@/lib/language-context'

function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`rounded-lg bg-black/50 border border-purple-500/50 ${className}`}>
      {children}
    </div>
  )
}

export default function Home() {
  const { language } = useLanguage()

  return (
    <div className="cyberpunk-grid noise min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Problem & Solution */}
      <ProblemSolution />

      {/* Key Modules */}
      <KeyModules />

      {/* Architecture Section */}
      <section id="architecture" className="py-20 container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 neon-text-purple">
          {language === 'zh' ? '系统架构' : 'System Architecture'}
        </h2>
        <div className="mb-8">
          <ArchitectureScene />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          <RiskRadar />
          <Card className="border-2 border-purple-500 shadow-[0_0_30px_rgba(168,85,247,0.3)] p-8">
            <h3 className="text-2xl font-bold neon-text-purple mb-4">
              {language === 'zh' ? '数据流' : 'Data Flow'}
            </h3>
            <div className="space-y-3">
              {[
                '用户画像分析',
                '策略引擎生成',
                '实时风险监控',
                '自动化调仓',
                '合规审计'
              ].map((step, i) => (
                <div key={i} className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500 flex items-center justify-center mr-3 neon-text-purple font-bold">
                    {i + 1}
                  </div>
                  <span className="text-gray-300">{language === 'zh' ? step : step}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Metrics */}
      <MetricsPanel />

      {/* Use Cases */}
      <UseCases />

      {/* Roadmap */}
      <TimelineRoadmap />

      {/* FAQ */}
      <FAQ />

      {/* Contact */}
      <ContactForm />

      {/* Footer */}
      <FooterCRT />
    </div>
  )
}
