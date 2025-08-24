import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createRouteClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!session) return NextResponse.json({ error: 'No session' }, { status: 401 });
  return NextResponse.json({ session });
}
