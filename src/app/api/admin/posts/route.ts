import { NextResponse } from 'next/server';
import { requireAdmin } from '../_utils';

// GET /api/admin/posts?page=&page_size=&author=
export async function GET(req: Request) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
  const { supabase } = auth;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(100, parseInt(searchParams.get('page_size') || '50', 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const author = searchParams.get('author');
  let query = supabase.from('posts').select('id, author, content, created_at, category', { count: 'exact' }).order('created_at', { ascending: false });
  if (author) query = query.eq('author', author);
  const { data, error, count } = await query.range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ posts: data, page, page_size: pageSize, total: count || 0 });
}
