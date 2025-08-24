import { Button } from "@/app/components/ui/button";
import { getServerClient } from '@/lib/supabaseServer';
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export async function LandingHero() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
    isAdmin = !!profile?.is_admin;
  }
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 sm:py-32">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Connect, Share, <span className="text-primary">Discover</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Join the next generation of social networking. Share your moments, connect with friends, and discover
            communities that matter to you.
          </p>

          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg">
              <Link href="/auth/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            {isAdmin && (
              <Button asChild size="lg" variant="outline" className="px-8 py-3 text-lg">
                <Link href="/admin">Go to Admin</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
