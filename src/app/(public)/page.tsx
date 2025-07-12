import { Header } from "@/components/sections/Header"
import { Hero } from "@/components/sections/Hero"
import { Features } from "@/components/sections/Features"
import { Demo } from "@/components/sections/Demo"
import { Testimonials } from "@/components/sections/Testimonials"
import { Pricing } from "@/components/sections/Pricing"
import { Footer } from "@/components/sections/Footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <div id="features">
          <Features />
        </div>
        <Demo />
        <Testimonials />
        <div id="pricing">
          <Pricing />
        </div>
      </main>
      <Footer />
    </div>
  )
}