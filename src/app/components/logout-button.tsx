"use client";
import { useState } from 'react';

export function LogoutButton() {
  const [loading, setLoading] = useState(false);

  async function handle(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      // Next.js logout endpoint redirects; follow it manually if URL provided
      if (res.redirected) {
        window.location.href = res.url;
      } else {
        window.location.href = '/';
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handle} className="w-full">
      <button
        type="submit"
        disabled={loading}
        className="w-full text-left flex items-center gap-2 disabled:opacity-60"
      >
        {loading && (
          <svg className="h-4 w-4 animate-spin text-current" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
        <span>{loading ? 'Logging out...' : 'Log out'}</span>
        <span className="sr-only">Logout button</span>
      </button>
    </form>
  );
}
