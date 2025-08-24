import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabase = await createRouteClient();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(50, parseInt(searchParams.get('page_size') || '20', 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('profiles')
    .select('id, username, avatar_url, bio, privacy', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (q) {
    // Simple ILIKE filters (needs pg_trgm extension for better search if desired)
    query = query.ilike('username', `%${q}%`);
  }

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({
    users: data?.map(p => ({
      id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      bio: p.bio,
      privacy: p.privacy,
    })),
    page,
    page_size: pageSize,
    total: count || 0,
    has_more: count ? to + 1 < count : false
  });
}
