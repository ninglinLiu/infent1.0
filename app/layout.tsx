import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LanguageProvider } from "@/lib/language-context"
import { NeonHeader } from "@/components/NeonHeader"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Pro - Omni-Intelligent Investment Advisor",
  description: "AI-powered investment advisor with real-time risk management and intelligent strategy recommendations",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <NeonHeader />
          <main className="pt-20">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  )
}
