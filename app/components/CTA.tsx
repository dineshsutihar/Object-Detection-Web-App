import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/20 to-secondary/20">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-6 text-primary">Ready to Detect Objects in Your Images?</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-300">
          Join thousands of satisfied users and experience the power of our AI-driven object detection.
        </p>
        <Button size="lg" variant="secondary" asChild>
          <Link href="/detect">Try It Now</Link>
        </Button>
      </div>
    </section>
  )
}

