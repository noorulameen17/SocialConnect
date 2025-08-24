import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const supabase = await createRouteClient();
  try {
    const { new_password } = await req.json();
    if (!new_password) return NextResponse.json({ error: 'new_password required' }, { status: 400 });
    const { data, error } = await supabase.auth.updateUser({ password: new_password });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ message: 'Password updated', user: data.user });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}
