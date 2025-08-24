import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

interface RouteParams { params: { id: string } }

// Helper to count likes
async function getLikeCount(supabase: any, postId: string) {
  const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  return count || 0;
}

export async function POST(_req: Request, ctx: RouteParams) {
  const { id: postId } = ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: viewerProfile } = await supabase.from('profiles').select('active').eq('id', user.id).single();
  if (viewerProfile?.active === false) return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });
  const { data: postRow } = await supabase.from('posts').select('author').eq('id', postId).single();
  const postAuthor = postRow?.author;
  const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
  if (error && !error.message.toLowerCase().includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!error && postAuthor && postAuthor !== user.id) {
    await supabase.from('notifications').insert({ recipient: postAuthor, actor: user.id, type: 'like', post_id: postId, is_read: false, message: 'liked your post' }).select('id');
  }
  const total = await getLikeCount(supabase, postId);
  const { data: actorProfile } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', user.id).single();
  return NextResponse.json({ liked: true, total, actor: actorProfile });
}

export async function DELETE(_req: Request, ctx: RouteParams) {
  const { id: postId } = ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: viewerProfile } = await supabase.from('profiles').select('active').eq('id', user.id).single();
  if (viewerProfile?.active === false) return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });
  const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const total = await getLikeCount(supabase, postId);
  return NextResponse.json({ liked: false, total });
}
