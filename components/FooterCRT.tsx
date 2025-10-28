'use client'

export function FooterCRT() {
  return (
    <footer className="relative border-t border-cyan-500/20 mt-20 pt-12 pb-6">
      <div className="scanline"></div>
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h3 className="text-2xl font-bold neon-text-cyan mb-2">AI Pro</h3>
            <p className="text-gray-400 text-sm">
              Omni-Intelligent Investment Advisor & Risk Management
            </p>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
              Twitter
            </a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
              LinkedIn
            </a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">
              GitHub
            </a>
          </div>
        </div>
        <div className="border-t border-cyan-500/20 pt-6 text-center text-sm text-gray-500">
          <p>© 2024 AI Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
