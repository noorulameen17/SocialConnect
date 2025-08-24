'use client';
import { Bell } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { NotificationListener } from './notification-listener';
import { Button } from './ui/button';

interface Props {
  userId: string;
  initialUnread: number;
}

export function NotificationBell({ userId, initialUnread }: Props) {
  const [unread, setUnread] = useState(initialUnread);
  const handleUnreadChange = useCallback((c: number) => setUnread(c), []);

  return (
    <>
      <NotificationListener userId={userId} initialUnread={initialUnread} onUnreadChange={handleUnreadChange} />
      <Button asChild variant="ghost" size="icon" className="relative hover:bg-card" aria-label="Notifications">
        <Link href="/notifications">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-4 px-1 rounded-full bg-red-600 text-[10px] font-medium text-white flex items-center justify-center animate-in fade-in">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </Link>
      </Button>
    </>
  );
}
