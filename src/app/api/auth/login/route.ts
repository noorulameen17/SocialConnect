import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

async function getEmailForUsername(supabase: any, username: string): Promise<string | null> {
  // Option 1: maintain email in profiles table (preferred). Attempt to read it.
  const { data, error } = await supabase.from('profiles').select('email').eq('username', username).single();
  if (error || !data) return null;
  return data.email;
}

export async function POST(req: Request) {
  const supabase = await createRouteClient();
  try {
    const { identifier, password } = await req.json();
    if (!identifier || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });

    let email = identifier.trim();
    if (!identifier.includes('@')) {
      const fetched = await getEmailForUsername(supabase, identifier.trim());
      if (!fetched) return NextResponse.json({ error: 'User not found' }, { status: 404 });
      email = fetched;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ user: data.user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
