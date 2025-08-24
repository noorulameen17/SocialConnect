import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createRouteClient();
  try {
    const { current_password, new_password } = await req.json();
    if (!current_password || !new_password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    // Re-auth by signing in again (Supabase requirement for sensitive action)
    const { data: { user }, error: sessionErr } = await supabase.auth.getUser();
    if (sessionErr || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { error: signInErr } = await supabase.auth.signInWithPassword({ email: user.email!, password: current_password });
    if (signInErr) return NextResponse.json({ error: 'Current password incorrect' }, { status: 400 });

    const { data, error } = await supabase.auth.updateUser({ password: new_password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Password changed', user: data.user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
