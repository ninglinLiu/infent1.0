'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/lib/language-context'

export function HeroGlitchTitle() {
  const { language } = useLanguage()
  const [title, setTitle] = useState('')

  useEffect(() => {
    // Direct import for client component
    import('@/content/project.json').then(data => {
      setTitle(data.default.projectTitle[language])
    })
  }, [language])

  if (!title) return null

  return (
    <div className="relative text-center mb-12">
      <h1 
        className="text-5xl md:text-7xl font-bold mb-4 neon-text-cyan glitch"
        data-text={title}
      >
        {title}
      </h1>
      <div className="h-1 w-64 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent blur-sm"></div>
    </div>
  )
}
