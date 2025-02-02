import Link from "next/link"
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-card/50 backdrop-blur-sm text-gray-300 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-primary">ObjectDetect</h3>
            <p className="text-gray-400">Empowering vision with AI-driven object detection.</p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#features" className="hover:text-secondary transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#testimonials" className="hover:text-secondary transition-colors">
                  Testimonials
                </Link>
              </li>
              <li>
                <Link href="/detect" className="hover:text-secondary transition-colors">
                  Try It
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary">Connect</h4>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-secondary transition-colors">
                <Facebook className="h-6 w-6" />
              </Link>
              <Link href="#" className="hover:text-secondary transition-colors">
                <Twitter className="h-6 w-6" />
              </Link>
              <Link href="#" className="hover:text-secondary transition-colors">
                <Instagram className="h-6 w-6" />
              </Link>
              <Link href="#" className="hover:text-secondary transition-colors">
                <Linkedin className="h-6 w-6" />
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} ObjectDetect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

