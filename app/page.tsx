import Hero from "./components/Hero";
import Features from "./components/Features";
import { CTA } from "./components/CTA";
import { Pricing } from "./components/Pricing";

export default function Home() {
  return (
    <main className="w-11/12 mx-auto">
      <Hero />
      <Features />
      <Pricing />
      <CTA />
    </main>
  );
}
