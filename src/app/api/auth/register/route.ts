import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createRouteClient();
  try {
    const body = await req.json();
    const { email, password, username } = body;
    if (!email || !password || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }
    const uname = String(username).trim();
    if (!/^\w{3,30}$/.test(uname)) {
      return NextResponse.json({ error: 'Username must be 3-30 chars (letters/numbers/underscore)' }, { status: 400 });
    }
    // Check uniqueness
    const { data: existing, error: existErr } = await supabase.from('profiles').select('id').eq('username', uname).maybeSingle();
    if (existErr) return NextResponse.json({ error: existErr.message }, { status: 400 });
    if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, username: uname, email });
    }
    return NextResponse.json({ message: 'Registered. If email confirmation is enabled, verify your email.' });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
