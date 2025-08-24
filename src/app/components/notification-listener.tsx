'use client';
import { getBrowserClient } from '@/lib/supabaseClient';
import { useEffect, useRef, useState } from 'react';

export interface RealtimeNotification {
  id: string;
  recipient: string;
  actor: string;
  type: 'follow' | 'like' | 'comment';
  post_id?: string | null;
  comment_id?: string | null;
  is_read: boolean;
  created_at: string;
  data?: any;
  actor_profile?: { id: string; username: string; avatar_url: string | null } | null;
}

interface Props {
  userId: string;
  initialUnread: number; // new
  onNew?: (n: RealtimeNotification) => void;
  onUnreadChange?: (count: number) => void; // expects absolute count
}

export function NotificationListener({ userId, initialUnread, onNew, onUnreadChange }: Props) {
  const [unread, setUnread] = useState<number>(initialUnread);
  const supabaseRef = useRef<ReturnType<typeof getBrowserClient> | null>(null);

  useEffect(() => {
    const supabase = getBrowserClient();
    supabaseRef.current = supabase;

    const enrich = async (n: RealtimeNotification): Promise<RealtimeNotification> => {
      try {
        if (!n.actor) return n;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', n.actor)
          .single();
        return { ...n, actor_profile: profile || null };
      } catch {
        return n;
      }
    };

    const channel = supabase
      .channel('realtime:notifications:' + userId)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient=eq.${userId}` }, async (payload) => {
        let n = payload.new as RealtimeNotification;
        n = await enrich(n);
        onNew?.(n);
        if (!n.is_read) {
          setUnread(prev => {
            const next = prev + 1;
            // schedule to avoid render phase warnings
            queueMicrotask(() => onUnreadChange?.(next));
            return next;
          });
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `recipient=eq.${userId}` }, async (payload) => {
        let n = payload.new as RealtimeNotification;
        if (!n.actor_profile) n = await enrich(n);
        onNew?.(n);
        // Do NOT adjust unread here to avoid double-decrement; parent handles local read state.
      })
      .subscribe();

    return () => {
      if (supabaseRef.current) supabaseRef.current.removeChannel(channel);
    };
  }, [userId, onNew, onUnreadChange]);

  return null;
}
