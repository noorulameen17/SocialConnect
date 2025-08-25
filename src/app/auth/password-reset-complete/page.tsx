"use client";
import { getBrowserClient } from '@/lib/supabaseClient';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PasswordResetCompletePage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string|null>(null);
  const [err, setErr] = useState<string|null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = getBrowserClient();

  // Ensure the code/hash tokens from the email link are processed and a session exists.
  useEffect(() => {
    (async () => {
      const code = searchParams.get('code');
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErr(error.message || 'Invalid or expired recovery code. Request a new link.');
            setReady(true);
            return;
          }
        }
        await new Promise(r => setTimeout(r, 50));
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setErr('Recovery link invalid or expired. Request a new one.');
        }
      } catch (e: any) {
        setErr(e.message || 'Unexpected error processing link');
      } finally {
        setReady(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (password.length < 6) { setErr('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) setErr(error.message); else { setMsg('Password updated'); setTimeout(()=> router.push('/auth/login'), 800); }
    } catch (e: any) {
      setErr(e.message || 'Network error');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold text-center">Set new password</h1>
        <form onSubmit={submit} className="space-y-4 bg-card border border-border rounded-lg p-6 shadow-sm">
          <input className="w-full border px-3 py-2 rounded" type="password" required placeholder="New password" value={password} onChange={e=>setPassword(e.target.value)} disabled={!ready} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          {msg && <p className="text-sm text-green-600">{msg}</p>}
          <button disabled={loading || !ready} className="w-full bg-black text-white py-2 rounded flex items-center justify-center gap-2 disabled:opacity-50">
            {(loading) && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
            <span>{!ready ? 'Preparing...' : (loading ? 'Updating...' : 'Update password')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
