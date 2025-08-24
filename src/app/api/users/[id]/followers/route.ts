import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createRouteClient();
  const { id } = await params;
  const userId = id;
  const { data, error } = await supabase
    .from('follows')
    .select('follower')
    .eq('following', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ followers: data });
}
