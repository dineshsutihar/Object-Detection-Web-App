"use client";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Brain, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto">
        <div
          onClick={() => router.push("/")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">ObjectAI</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="#features"
            className="text-sm font-medium hover:text-primary"
          >
            Features
          </Link>
          <Link href="#demo" className="text-sm font-medium hover:text-primary">
            Demo
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium hover:text-primary"
          >
            Pricing
          </Link>
          <Link href="#docs" className="text-sm font-medium hover:text-primary">
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <Button>Get Started</Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container flex flex-col py-4">
            <Link
              href="#features"
              className="py-2 text-sm font-medium hover:text-primary"
            >
              Features
            </Link>
            <Link
              href="#demo"
              className="py-2 text-sm font-medium hover:text-primary"
            >
              Demo
            </Link>
            <Link
              href="#pricing"
              className="py-2 text-sm font-medium hover:text-primary"
            >
              Pricing
            </Link>
            <Link
              href="#docs"
              className="py-2 text-sm font-medium hover:text-primary"
            >
              Docs
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
