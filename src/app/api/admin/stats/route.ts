import { NextResponse } from 'next/server';
import { requireAdmin } from '../_utils';

// GET /api/admin/stats
export async function GET() {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
  const { supabase } = auth;

  const [{ count: usersCount }, { count: postsCount }, activeToday] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    supabase.rpc('active_users_today').then(r => ({ data: r.data, error: r.error }))
  ]);

  let activeTodayCount = 0;
  if ('error' in activeToday && activeToday.error) {
    // fallback: count profiles updated today (approximation)
    const today = new Date();
    today.setHours(0,0,0,0);
    const { data, error } = await supabase.from('profiles').select('id').gte('updated_at', today.toISOString());
    if (!error && data) activeTodayCount = data.length;
  } else {
    activeTodayCount = (activeToday as any).data || 0;
  }

  return NextResponse.json({ total_users: usersCount || 0, total_posts: postsCount || 0, active_today: activeTodayCount });
}
