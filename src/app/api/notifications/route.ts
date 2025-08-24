import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = Math.min(50, parseInt(searchParams.get('page_size') || '20', 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from('notifications')
    .select('*, actor_profile:actor(id, username, avatar_url)', { count: 'exact' })
    .eq('recipient', user.id)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ notifications: data, page, page_size: pageSize, total: count || 0, has_more: count ? to + 1 < count : false });
}

export async function DELETE() {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  // Delete all notifications for this user
  const { error } = await supabase.from('notifications').delete().eq('recipient', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ cleared: true });
}
