"use client";

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

// Generic helper to call admin API with JSON body
async function adminFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
  });
  let data: any = null;
  try { 
    data = await res.json(); 
  } catch (jsonError) { 
    console.error('Failed to parse JSON response:', jsonError);
    throw new Error(`Request failed (${res.status}): Invalid JSON response`);
  }
  if (!res.ok) {
    console.error('API Error:', { status: res.status, data });
    throw new Error(data?.error || `Request failed (${res.status})`);
  }
  return data;
}

export function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const handleDelete = () => {
    if (!confirm('Delete this post?')) return;
    setErr(null);
    startTransition(async () => {
      try {
        await adminFetch(`/api/admin/posts/${postId}`, { method: 'DELETE' });
        router.refresh();
      } catch (e: any) {
        setErr(e.message);
        alert(e.message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? 'Deleting…' : 'Delete'}
    </button>
  );
}

export function ToggleAdminButton({ targetId, isAdmin, username }: { targetId: string; isAdmin: boolean; username: string; }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    const action = isAdmin ? 'demote' : 'promote';
    if (!confirm(`Are you sure you want to ${action} ${username}?`)) return;
    console.log('Toggling admin status for user:', { targetId, isAdmin, username });
    startTransition(async () => {
      try {
        const response = await adminFetch(`/api/admin/users/${targetId}`, { 
          method: 'PATCH', 
          body: JSON.stringify({ is_admin: !isAdmin }) 
        });
        console.log('Admin toggle successful:', response);
        router.refresh();
      } catch (e: any) {
        console.error('Admin toggle failed:', e);
        alert(e.message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className="text-xs text-blue-600 hover:underline disabled:opacity-50"
    >
      {pending ? 'Saving…' : (isAdmin ? 'Demote' : 'Promote')}
    </button>
  );
}

export function ToggleActiveButton({ targetId, active, username }: { targetId: string; active: boolean; username: string; }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleToggle = () => {
    const action = active ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} ${username}?`)) return;
    console.log('Toggling active status for user:', { targetId, active, username });
    startTransition(async () => {
      try {
        const response = await adminFetch(`/api/admin/users/${targetId}`, { 
          method: 'PATCH', 
          body: JSON.stringify({ active: !active }) 
        });
        console.log('Active toggle successful:', response);
        router.refresh();
      } catch (e: any) {
        console.error('Active toggle failed:', e);
        alert(e.message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={pending}
      className="text-xs text-red-600 hover:underline ml-2 disabled:opacity-50"
    >
      {pending ? 'Saving…' : (active ? 'Deactivate' : 'Reactivate')}
    </button>
  );
}
