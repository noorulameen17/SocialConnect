import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

interface RouteParams { params: { id: string } }

export async function GET(_req: Request, ctx: RouteParams) {
  const { id: postId } = ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const [{ count: totalLikes }, { data: existing }] = await Promise.all([
    supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId),
    supabase.from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle()
  ]);
  return NextResponse.json({ liked: !!existing, total: totalLikes || 0 });
}
