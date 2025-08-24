"use client";
import { LogOut } from 'lucide-react';
import { useState } from 'react';

export function LogoutForm() {
  const [loading, setLoading] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    if (loading) { e.preventDefault(); return; }
    setLoading(true);
    // allow normal form submission (POST -> route) to proceed after small delay for spinner paint
    setTimeout(() => {}, 0);
  }
  return (
    <form action="/api/auth/logout" method="post" onSubmit={onSubmit} className="w-full">
      <button
        type="submit"
        className="group w-full flex items-center justify-between text-sm px-2 py-1.5 rounded-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 transition-colors hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
        disabled={loading}
      >
        <div className="flex items-center gap-2">
          {loading && (
            <svg className="h-4 w-4 animate-spin text-red-600" viewBox="0 0 24 24" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
          )}
          <span className="transition-colors">{loading ? 'Logging out...' : 'Log out'}</span>
        </div>
        {!loading && (
          <LogOut className="h-4 w-4 opacity-0 group-hover:opacity-100 text-red-600 transition-opacity" aria-hidden="true" />
        )}
      </button>
    </form>
  );
}
