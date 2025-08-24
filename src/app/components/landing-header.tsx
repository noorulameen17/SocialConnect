import { Button } from "@/app/components/ui/button"
import Link from "next/link"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center space-x-2">
          <Link href="/" className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">S</span>
          </Link>
          <Link href="/" className="font-heading font-bold text-xl text-foreground hover:opacity-90 transition-colors">
            SocialConnect
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
          <Link href="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="/#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
            Testimonials
          </Link>
          <Link href="/auth/login" className="text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>
          <Link href="/auth/signup" className="text-muted-foreground hover:text-foreground transition-colors">
            Sign Up
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Button asChild variant="ghost" className="sm:inline-flex hidden">
            <Link href="/auth/login">Sign In</Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/auth/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
