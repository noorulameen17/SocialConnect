import { getServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NotificationCenter } from '../components/notification-center';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Plain fetch (no implicit join) to avoid missing relationship error
  const { data: rawNotifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('recipient', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Manual enrichment
  let enriched: any[] = rawNotifications || [];
  if (enriched.length) {
    const actorIds = Array.from(new Set(enriched.map(n => (n.actor ?? n.actor_id ?? n.user_id)).filter(Boolean)));
    if (actorIds.length) {
      const { data: actorProfiles } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', actorIds as string[]);
      const map = new Map(actorProfiles?.map(p => [p.id, p]) || []);
      enriched = enriched.map(n => ({
        ...n,
        actor: n.actor ?? n.actor_id ?? n.user_id ?? null,
        actor_profile: map.get(n.actor ?? n.actor_id ?? n.user_id) || null
      }));
    }
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient', user.id)
    .eq('is_read', false);

  return (
    <div className="min-h-screen w-full px-6 py-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/feed" className="text-sm px-3 py-1 rounded border hover:bg-muted">Feed</Link>
        <Link href="/profile" className="text-sm px-3 py-1 rounded border hover:bg-muted">Profile</Link>
        <Link href="/new-post" className="text-sm px-3 py-1 rounded border hover:bg-muted">New Post</Link>
      </div>
      <NotificationCenter userId={user.id} initial={enriched as any} initialUnread={unreadCount || 0} />
      {error && <p className="mt-4 text-xs text-red-500">Notification load error: {error.message}</p>}
    </div>
  );
}
