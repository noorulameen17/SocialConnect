"use client";
import { useEffect, useState, useTransition } from 'react';
import { Button } from './ui/button';

interface FollowState {
  is_following: boolean;
  followers_count: number;
}

export function FollowButton({ targetId, compact = false }: { targetId: string; compact?: boolean }) {
  const [state, setState] = useState<FollowState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    fetch(`/api/users/${targetId}/follow`, { method: 'GET' })
      .then(r => r.json())
      .then(d => { if (active && !d.error) setState({ is_following: d.is_following, followers_count: d.followers_count }); });
    return () => { active = false; };
  }, [targetId]);

  const toggle = () => {
    if (!state) return;
    setError(null);
    const follow = !state.is_following;
    // optimistic
    setState(s => s && ({ ...s, is_following: follow, followers_count: s.followers_count + (follow ? 1 : -1) }));
    startTransition(async () => {
      const res = await fetch(`/api/users/${targetId}/follow`, { method: follow ? 'POST' : 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        setState(s => s && ({ ...s, is_following: !follow, followers_count: s.followers_count + (follow ? -1 : 1) }));
        setError(data.error || 'Error');
      } else {
        setState(s => s && ({ ...s, followers_count: data.followers_count, is_following: follow }));
      }
    });
  };

  if (!state) {
    return <Button disabled size={compact ? 'sm' : 'default'} variant="outline">...</Button>;
  }

  return (
    <div className={compact ? 'flex items-center gap-2' : 'flex items-center gap-3'}>
      <Button onClick={toggle} size={compact ? 'sm' : 'default'} variant={state.is_following ? 'secondary' : 'default'} disabled={pending}>
        {state.is_following ? 'Following' : 'Follow'}
      </Button>
      {!compact && <span className="text-sm text-muted-foreground">{state.followers_count} followers</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
