import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Header() {
  return (
    <header className="py-4 px-6 bg-card/50 backdrop-blur- z-[1000]">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-primary">
          ObjectDetect
        </Link>
        <nav className="hidden md:flex space-x-6">
          <Link href="/#features" className="text-gray-300 hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="/#testimonials" className="text-gray-300 hover:text-primary transition-colors">
            Testimonials
          </Link>
          <Link href="/detect" className="text-gray-300 hover:text-primary transition-colors">
            Try It
          </Link>
        </nav>
        <Button asChild variant="secondary">
          <Link href="/detect">Detect Objects</Link>
        </Button>
      </div>
    </header>
  )
}

