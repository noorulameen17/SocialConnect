"use client";
import Link from 'next/link';
import { useState } from 'react';
import { getBrowserClient } from '@/lib/supabaseClient';

export default function PasswordResetRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const supabase = getBrowserClient();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!email) { setErr('Email required'); return; }
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/auth/password-reset-complete`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) setErr(error.message); else setMsg('If that email exists, a reset link was sent.');
    } catch (e: any) {
      setErr(e.message || 'Network error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between text-sm">
          <Link href="/auth/login" className="text-blue-600 hover:underline">← Back to login</Link>
          <Link href="/auth/signup" className="text-muted-foreground hover:text-foreground">Need an account?</Link>
        </div>
        <h1 className="text-2xl font-semibold text-center">Reset password</h1>
        <form onSubmit={submit} className="space-y-4 bg-card border border-border rounded-lg p-6 shadow-sm">
          <input className="w-full border px-3 py-2 rounded" type="email" required placeholder="Your email" value={email} onChange={e=>setEmail(e.target.value)} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}
          <button disabled={loading} className="w-full bg-black text-white py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50">
            {loading && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
            <span>{loading ? 'Sending...' : 'Send reset link'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
