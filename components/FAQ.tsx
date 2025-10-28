'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/language-context'
import { Card, CardContent } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import ProjectData from '@/content/project.json'

export function FAQ() {
  const { language } = useLanguage()
  const [faqs, setFaqs] = useState<any[]>([])
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    setFaqs(ProjectData.faq[language])
  }, [language])

  return (
    <section className="py-20 container mx-auto px-4">
      <h2 className="text-4xl font-bold text-center mb-12 neon-text-cyan">
        {language === 'zh' ? '常见问题' : 'FAQ'}
      </h2>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, index) => (
          <Card 
            key={index} 
            className="border-2 border-cyan-500/50 hover:border-cyan-500 transition-colors"
          >
            <CardContent className="p-0">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="neon-text-cyan font-semibold text-lg">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 neon-text-cyan transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-gray-300">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
