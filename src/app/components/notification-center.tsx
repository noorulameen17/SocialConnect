'use client';
import { getBrowserClient } from '@/lib/supabaseClient';
import { Check, Heart, MessageSquare, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { NotificationListener, RealtimeNotification } from './notification-listener';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';

interface Props {
  userId: string;
  initial: RealtimeNotification[];
  initialUnread: number;
}

function formatRelative(dateIso: string) {
  const d = new Date(dateIso);
  const diff = Date.now() - d.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString();
}

function typeMeta(type: string) {
  switch (type) {
    case 'follow': return { icon: <UserPlus className="h-4 w-4 text-blue-600" />, text: 'started following you' };
    case 'like': return { icon: <Heart className="h-4 w-4 text-rose-600" />, text: 'liked your post' };
    case 'comment': return { icon: <MessageSquare className="h-4 w-4 text-emerald-600" />, text: 'commented on your post' };
    default: return { icon: <Check className="h-4 w-4" />, text: type };
  }
}

export function NotificationCenter({ userId, initial, initialUnread }: Props) {
  const [notifications, setNotifications] = useState(initial);
  const [unread, setUnread] = useState(initialUnread);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initial.length === 50); // heuristic
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [busy, setBusy] = useState(false); // for mark all
  // Fallback enrichment for initial notifications missing actor_profile
  // Runs once per unique set of missing actor ids
  const enrichedOnceRef = (globalThis as any).__notifEnrichedOnceRef || ((globalThis as any).__notifEnrichedOnceRef = { done: new Set<string>() });

  const upsert = useCallback((n: RealtimeNotification) => {
    setNotifications(prev => {
      if (prev.find(p => p.id === n.id)) { // update existing
        return prev.map(p => p.id === n.id ? n : p);
      }
      return [n, ...prev];
    });
  }, []);

  const handleUnreadChange = useCallback((c: number) => { setUnread(c); }, []);

  async function markRead(id: string) {
    const idx = notifications.findIndex(n => n.id === id);
    if (idx === -1 || notifications[idx].is_read) return;
    const prev = notifications[idx];
    setNotifications(list => list.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(u => Math.max(0, u - 1));
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    if (!res.ok) { // rollback
      setNotifications(list => list.map(n => n.id === id ? prev : n));
      setUnread(u => prev.is_read ? u : u + 1);
    }
  }

  async function markAllRead() {
    if (!unread || busy) return;
    setBusy(true);
    const prev = notifications;
    setNotifications(prevList => prevList.map(n => ({ ...n, is_read: true })));
    const prevUnread = unread;
    setUnread(0);
    const res = await fetch('/api/notifications/mark-all-read', { method: 'POST' });
    if (!res.ok) { // rollback
      setNotifications(prev);
      setUnread(prevUnread);
    }
    setBusy(false);
  }

  async function loadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await fetch(`/api/notifications?page=${nextPage}`);
    const json = await res.json();
    const newItems: RealtimeNotification[] = json.notifications || [];
    setNotifications(prev => [...prev, ...newItems]);
    setPage(nextPage);
    setHasMore(json.has_more);
    setLoadingMore(false);
  }

  async function clearAll(){
    if(!notifications.length||busy) return; // reuse busy flag
    if(!confirm('Delete all notifications? This cannot be undone.')) return;
    setBusy(true);
    const prev = notifications;
    setNotifications([]);setUnread(0);
    const res = await fetch('/api/notifications', { method: 'DELETE' });
    if(!res.ok){
      // rollback
      setNotifications(prev);
      setUnread(prev.filter(n=>!n.is_read).length);
      alert('Failed to clear notifications');
    }
    setBusy(false);
  }

  const visible = filter === 'all' ? notifications : notifications.filter(n => !n.is_read);
  // Client-side enrichment effect
  // (Placed just before return to keep file concise)
  if (typeof window !== 'undefined') {
    (async () => {
      const missing = notifications.filter(n => n.actor && !n.actor_profile && !enrichedOnceRef.done.has(n.actor));
      if (!missing.length) return;
      const ids = Array.from(new Set(missing.map(m => m.actor)));
      ids.forEach(id => enrichedOnceRef.done.add(id));
      const supabase = getBrowserClient();
      const { data: profiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', ids as string[]);
      if (profiles && profiles.length) {
        setNotifications(prev => prev.map(n => n.actor && !n.actor_profile ? { ...n, actor_profile: profiles.find(p => p.id === n.actor) || null } : n));
      }
    })();
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-md border bg-background p-0.5 gap-2">
            <Button type="button" variant={filter === 'all' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('all')}>
              All
            </Button>
            <Button type="button" variant={filter === 'unread' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter('unread')}>
              Unread
              {unread > 0 && <span className="ml-1 text-[10px] px-1 rounded bg-red-600 text-white">{unread}</span>}
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={markAllRead} disabled={!unread || busy}>{busy?'...':'Mark all read'}</Button>
          <Button variant="destructive" size="sm" onClick={clearAll} disabled={!notifications.length || busy}>{busy?'...':'Clear'}</Button>
        </div>
      </div>
      <ul className="divide-y border rounded-md bg-card">
        {visible.map(n => {
          const meta = typeMeta(n.type);
          const actor = n.actor_profile;
          return (
            <li key={n.id} className={"flex items-start gap-3 px-4 py-3 hover:bg-muted/60 " + (!n.is_read ? 'bg-muted/30' : '')}>
              <div className="mt-1 shrink-0">{meta.icon}</div>
              <div className="flex items-start gap-3 flex-1">
                {actor && (
                  <Avatar className="h-8 w-8 mt-0.5">
                    <AvatarImage src={actor.avatar_url || '/placeholder.svg'} alt={actor.username || 'User'} />
                    <AvatarFallback>{(actor.username || 'U').substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 min-w-0 text-sm leading-snug">
                  <div className="flex flex-wrap items-center gap-1">
                    {actor && (
                      <Link href={`/users/${actor.id}`} className="font-medium hover:underline">
                        @{actor.username}
                      </Link>
                    )}
                    <span className="font-medium">{meta.text}</span>
                    {n.type === 'like' && n.post_id && (
                      <Link href={`/users/${userId}/posts/${n.post_id}`} className="text-blue-600 hover:underline">View post</Link>
                    )}
                    {n.type === 'comment' && n.post_id && (
                      <Link href={`/users/${userId}/posts/${n.post_id}`} className="text-blue-600 hover:underline">View discussion</Link>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelative(n.created_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!n.is_read && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>Mark</Button>}
              </div>
            </li>
          );
        })}
        {!visible.length && (
          <li className="px-4 py-10 text-center text-sm text-muted-foreground">No notifications{filter === 'unread' ? ' unread' : '.'}</li>
        )}
      </ul>
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
      <NotificationListener userId={userId} initialUnread={initialUnread} onNew={upsert} onUnreadChange={handleUnreadChange} />
    </div>
  );
}
