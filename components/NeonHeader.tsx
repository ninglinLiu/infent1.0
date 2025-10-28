'use client'

import Link from 'next/link'
import { LanguageSwitch } from './LanguageSwitch'

export function NeonHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-cyan-500/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="relative">
            <span className="text-2xl font-bold neon-text-cyan">AI</span>
            <span className="text-2xl font-bold neon-text-magenta">Pro</span>
          </div>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="#features" className="neon-text-cyan hover:text-cyan-300 transition-colors">
            Features
          </Link>
          <Link href="#architecture" className="neon-text-cyan hover:text-cyan-300 transition-colors">
            Architecture
          </Link>
          <Link href="#metrics" className="neon-text-cyan hover:text-cyan-300 transition-colors">
            Metrics
          </Link>
          <Link href="#contact" className="neon-text-cyan hover:text-cyan-300 transition-colors">
            Contact
          </Link>
        </nav>
        <div className="flex items-center space-x-2">
          <LanguageSwitch />
        </div>
      </div>
    </header>
  )
}
