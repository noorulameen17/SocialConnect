import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

type AsyncParams = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: AsyncParams) {
  const { id: postId } = await ctx.params;
  const supabase = await createRouteClient();
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
  const { data: commentsData, error } = await supabase
    .from('comments')
    .select('id, content, author, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  let enriched = commentsData || [];
  if (enriched.length) {
    const authorIds = Array.from(new Set(enriched.map(c => c.author).filter(Boolean)));
    if (authorIds.length) {
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', authorIds as string[]);
      const pMap = new Map(profiles?.map(p => [p.id, p]) || []);
      enriched = enriched.map(c => ({ ...c, profile: pMap.get(c.author) || null }));
    }
  }
  return NextResponse.json({ comments: enriched });
}

export async function POST(req: Request, ctx: AsyncParams) {
  const { id: postId } = await ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: viewerProfile } = await supabase.from('profiles').select('active').eq('id', user.id).single();
  if (viewerProfile?.active === false) return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });
  const body = await req.json();
  const content = (body.content || '').trim();
  if (!content || content.length > 200) return NextResponse.json({ error: 'Content required and <=200 chars' }, { status: 400 });
  const { data, error } = await supabase.from('comments').insert({ post_id: postId, content, author: user.id }).select('id, content, author, created_at').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data: actorProfile } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', user.id).single();
  const { data: postRow } = await supabase.from('posts').select('author').eq('id', postId).single();
  if (postRow?.author && postRow.author !== user.id) {
    await supabase.from('notifications').insert({ recipient: postRow.author, actor: user.id, type: 'comment', post_id: postId, comment_id: data.id, is_read: false, message: 'commented on your post' }).select('id');
  }
  return NextResponse.json({ comment_id: data.id, comment: { ...data, profile: actorProfile || null } });
}

export async function DELETE(req: Request, ctx: AsyncParams) {
  const { id: postId } = await ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: viewerProfile } = await supabase.from('profiles').select('active').eq('id', user.id).single();
  if (viewerProfile?.active === false) return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const commentIdParam = searchParams.get('comment_id');
  if (!commentIdParam) return NextResponse.json({ error: 'Missing comment_id' }, { status: 400 });
  const numericId = /^\d+$/.test(commentIdParam) ? parseInt(commentIdParam, 10) : commentIdParam;
  const { data: existing, error: fetchErr } = await supabase
    .from('comments')
    .select('id, author, post_id')
    .eq('id', numericId as any)
    .maybeSingle();
  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 400 });
  if (!existing || existing.post_id?.toString() !== postId.toString()) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.author !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { error: delErr } = await supabase.from('comments').delete().eq('id', numericId as any);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 400 });
  return NextResponse.json({ deleted: true, comment_id: commentIdParam });
}
