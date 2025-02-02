import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/20 to-secondary/20">
      <div className="container mx-auto text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">Detect Objects in Images</h1>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-300">
          Harness the power of AI to identify and locate objects in your images with ease and accuracy.
        </p>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/detect">Try Object Detection</Link>
        </Button>
      </div>
    </section>
  )
}

