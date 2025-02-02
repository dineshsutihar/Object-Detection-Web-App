import Hero from "./components/Hero"
import Features from "./components/Features"
import Testimonials from "./components/Testimonials"
import CTA from "./components/CTA"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main>
        <Hero />
        <Features />
        <Testimonials />
        <CTA />
      </main>
    </div>
  )
}

