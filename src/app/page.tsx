import { getServerClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import { LandingCTA } from "./components/landing-cta";
import { LandingFeatures } from "./components/landing-features";
import { LandingFooter } from "./components/landing-footer";
import { LandingHeader } from "./components/landing-header";
import { LandingHero } from "./components/landing-hero";
import { LandingTestimonials } from "./components/landing-testimonials";

export default async function LandingPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/feed');
  return (
    <div className="min-h-screen bg-background">
      <LandingHeader />
      <main className="flex flex-col gap-0">
        <LandingHero />
        <LandingFeatures />
        <LandingTestimonials />
        <LandingCTA />
      </main>
      <LandingFooter />
    </div>
  )
}
