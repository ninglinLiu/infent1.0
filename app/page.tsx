import { ShowcaseNav } from "@/components/showcase/ShowcaseNav"
import { Hero } from "@/components/showcase/Hero"
import { ProblemSection } from "@/components/showcase/ProblemSection"
import { SolutionSection } from "@/components/showcase/SolutionSection"
import { LandscapeSection } from "@/components/showcase/LandscapeSection"
import { ValueCanvas } from "@/components/showcase/ValueCanvas"
import { BrandSection } from "@/components/showcase/BrandSection"
import { TeamSection } from "@/components/showcase/TeamSection"
import { CTASection } from "@/components/showcase/CTASection"
import { Footer } from "@/components/showcase/Footer"
import { LiveAgentSection } from "@/components/showcase/LiveAgentSection"

export default function ShowcasePage() {
  return (
    <main className="relative min-h-screen bg-[var(--bg-0)] text-[var(--fg-0)] overflow-x-hidden">
      <ShowcaseNav />
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <LandscapeSection />
      <ValueCanvas />
      <LiveAgentSection />
      <BrandSection />
      <TeamSection />
      <CTASection />
      <Footer />
    </main>
  )
}
