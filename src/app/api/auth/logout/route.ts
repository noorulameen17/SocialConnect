import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createRouteClient();
  const { error } = await supabase.auth.signOut();
  // Derive origin safely (deployment friendly)
  const url = new URL(request.url);
  const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || url.origin;

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=logout_failed`, { status: 303 });
  }
  // 303 ensures the client performs a GET on the redirected location
  return NextResponse.redirect(`${origin}/`, { status: 303 });
}
