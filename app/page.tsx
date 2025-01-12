import Hero from "./components/Hero";
import Features from "./components/Features";
import { CTA } from "./components/CTA";
import { Pricing } from "./components/Pricing";

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <Pricing />
      <CTA />
    </main>
  );
}
