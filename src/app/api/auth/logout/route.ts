import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createRouteClient();
  const { error } = await supabase.auth.signOut();
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  if (error) return NextResponse.redirect(new URL('/auth/login?error=logout_failed', base));
  return NextResponse.redirect(new URL('/', base));
}
