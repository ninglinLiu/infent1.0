'use client'
import { useEffect, useState } from 'react'
import { useLang } from '@/lib/i18n'

type InstallEvent = Event & { prompt(): Promise<void>; userChoice: Promise<{ outcome: string }> }
export function PwaInstall() {
  const { lang } = useLang()
  const [install, setInstall] = useState<InstallEvent | null>(null)
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).catch(() => {})
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setInstall(e as InstallEvent) }
    const onInstalled = () => setInstall(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])
  if (!install) return null
  return <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl border border-[var(--line-2)] bg-[var(--bg-2)] p-2 shadow-lg">
    <button className="min-h-11 px-3 text-sm text-up" onClick={async () => { try { await install.prompt(); await install.userChoice } finally { setInstall(null) } }}>{lang === 'zh' ? '添加到桌面' : 'Install Infent'}</button>
    <button aria-label={lang === 'zh' ? '关闭安装提示' : 'Dismiss install prompt'} className="h-11 w-11 text-dim" onClick={() => setInstall(null)}>×</button>
  </div>
}
