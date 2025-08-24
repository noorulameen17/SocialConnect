import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

// GET /api/feed?page=1&page_size=20
export async function GET(req: Request) {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 20;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Get followed user ids
  const { data: followed, error: fErr } = await supabase
    .from('follows')
    .select('following')
    .eq('follower', user.id);
  if (fErr) return NextResponse.json({ error: fErr.message }, { status: 400 });
  const ids = followed?.map(f => f.following) || [];
  ids.push(user.id);

  // Fetch posts by those authors
  const { data: posts, error: pErr } = await supabase
    .from('posts')
    .select('id, content, image_url, category, created_at, author')
    .in('author', ids)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 400 });

  // Like & comment counts (simple extra queries per page; can optimize with RPC later)
  const postIds = posts?.map(p => p.id) || [];
  let likeMap: Record<string, number> = {}; let commentMap: Record<string, number> = {}; let likedSet = new Set<string>();
  if (postIds.length) {
    const { data: likesAgg } = await supabase.from('likes').select('post_id, count:post_id').in('post_id', postIds);
    likesAgg?.forEach((r: any) => { likeMap[r.post_id] = (likeMap[r.post_id] || 0) + 1; });
    const { data: commentsAgg } = await supabase.from('comments').select('post_id, count:post_id').in('post_id', postIds);
    commentsAgg?.forEach((r: any) => { commentMap[r.post_id] = (commentMap[r.post_id] || 0) + 1; });
    const { data: userLikes } = await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postIds);
    userLikes?.forEach((l: any) => likedSet.add(l.post_id));
  }

  const enriched = posts?.map(p => ({
    ...p,
    like_count: likeMap[p.id] || 0,
    comment_count: commentMap[p.id] || 0,
    liked: likedSet.has(p.id)
  }));

  return NextResponse.json({ page, page_size: pageSize, posts: enriched, has_more: enriched && enriched.length === pageSize });
}
