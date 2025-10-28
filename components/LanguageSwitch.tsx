'use client'

import { useLanguage } from '@/lib/language-context'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageSwitch() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="neon-text-cyan hover:bg-cyan-500/10"
      aria-label={language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Globe className="h-4 w-4 mr-2" />
      <span className="text-xs">{language === 'zh' ? 'EN' : '中'}</span>
    </Button>
  )
}
