import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createRouteClient();
  const userId = params.id;
  const { data, error } = await supabase
    .from('follows')
    .select('following')
    .eq('follower', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ following: data });
}
