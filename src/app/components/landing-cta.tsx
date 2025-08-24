import { Button } from "@/app/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function LandingCTA() {
  return (
    <section className="py-20 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Ready to join the conversation?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
            Start connecting with friends, sharing your moments, and discovering new communities today. It's free to get
            started.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-3 text-lg">
              <Link href="/auth/signup">Start Your Journey <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <p className="text-sm text-muted-foreground">No credit card required • Free forever plan available</p>
          </div>
          <div className="mt-16 flex items-center justify-center space-x-8 opacity-60">
            <div className="text-sm text-muted-foreground">Trusted by 50,000+ users</div>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm text-muted-foreground">99.9% uptime</div>
            <div className="h-4 w-px bg-border" />
            <div className="text-sm text-muted-foreground">24/7 support</div>
          </div>
        </div>
      </div>
    </section>
  );
}
