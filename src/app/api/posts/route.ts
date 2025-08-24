import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(50, parseInt(searchParams.get('page_size') || '20', 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Basic privacy enforcement: exclude private/followers_only authors unless viewer is follower or same user.
  // (Simplified: fetch allowed author ids first if viewer authenticated.)
  let baseQuery = supabase
    .from('posts')
    .select('id, content, image_url, category, created_at, author', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (user) {
    // Get relationships for viewer
    const { data: follows } = await supabase.from('follows').select('following').eq('follower', user.id);
    const followingIds = new Set<string>((follows || []).map(f => f.following));
    // Fetch author privacies in window (could optimize with view or join)
    // For pagination fairness, we fetch wide then filter client-side; small scope for now.
    const { data, error, count } = await baseQuery.range(from, to);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ posts: [], page, page_size: pageSize, total: 0, has_more: false });
    const authorIds = Array.from(new Set(data.map(p => p.author)));
    const { data: profiles } = await supabase.from('profiles').select('id, privacy, active').in('id', authorIds as string[]);
    const pMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const filtered = data.filter(p => {
      const prof: any = pMap.get(p.author);
      if (!prof || prof.active === false) return false;
      if (!prof.privacy || prof.privacy === 'public') return true;
      if (p.author === user.id) return true;
      if (prof.privacy === 'private') return false;
      if (prof.privacy === 'followers_only') return followingIds.has(p.author);
      return true;
    });
    return NextResponse.json({ posts: filtered, page, page_size: pageSize, total: count || filtered.length, has_more: (count ? to + 1 < (count) : filtered.length === pageSize) });
  } else {
    // Unauthenticated: only public + active authors
    const { data, error, count } = await baseQuery.range(from, to);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    if (!data) return NextResponse.json({ posts: [], page, page_size: pageSize, total: 0, has_more: false });
    const authorIds = Array.from(new Set(data.map(p => p.author)));
    const { data: profiles } = await supabase.from('profiles').select('id, privacy, active').in('id', authorIds as string[]);
    const pMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const filtered = data.filter(p => {
      const prof: any = pMap.get(p.author);
      return prof && prof.active !== false && (!prof.privacy || prof.privacy === 'public');
    });
    return NextResponse.json({ posts: filtered, page, page_size: pageSize, total: filtered.length, has_more: filtered.length === pageSize });
  }
}

export async function POST(req: Request) {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Enforce deactivation (admin can set profiles.active = false)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('active, posts_count')
    .eq('id', user.id)
    .single();
  if (profileError) return NextResponse.json({ error: 'Profile lookup failed' }, { status: 400 });
  if (profile && profile.active === false) return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });

  const body = await req.json();
  const content = (body.content || '').trim();
  if (!content || content.length > 280) return NextResponse.json({ error: 'Content required and <=280 chars' }, { status: 400 });
  const category = body.category && ['general','announcement','question'].includes(body.category) ? body.category : 'general';
  const insert: any = { content, category, author: user.id };
  if (body.image_url) insert.image_url = body.image_url;
  const { data, error } = await supabase.from('posts').insert(insert).select('id').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Increment posts_count
  await supabase.from('profiles').update({ posts_count: (profile?.posts_count || 0) + 1 }).eq('id', user.id);
  return NextResponse.json({ post_id: data.id });
}
