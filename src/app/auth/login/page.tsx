"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [resent, setResent] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null); setResent(false);
    if (!form.identifier || !form.password) { setError('All fields required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: form.identifier.trim(), password: form.password })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Login failed');
      } else {
        setSuccess('Logged in');
        setTimeout(() => router.push('/profile'), 400);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  async function resend() {
    if (!form.identifier.includes('@')) return; // need email for resend
    setResent(false); setError(null);
    try {
      const r = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.identifier, password: '__temp__', username: 'temp__' }) });
      if (r.ok) setResent(true);
    } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">← Home</Link>
          <Link href="/auth/signup" className="text-sm text-muted-foreground hover:text-foreground">Need an account? Sign up</Link>
        </div>
        <h1 className="text-3xl font-bold text-center">Sign in to your account</h1>
        <form onSubmit={submit} className="space-y-4 bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="space-y-2">
            <input name="identifier" required placeholder="Email or Username" value={form.identifier} onChange={onChange} className="w-full border px-3 py-2 rounded" />
            <input name="password" type="password" required placeholder="Password" value={form.password} onChange={onChange} className="w-full border px-3 py-2 rounded" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}
          <button disabled={loading} className="w-full bg-black text-white py-2 rounded disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
              </svg>
            )}
            <span>{loading ? 'Logging in...' : 'Login'}</span>
          </button>
          {error?.toLowerCase().includes('confirm') && form.identifier.includes('@') && (
            <button type="button" onClick={resend} className="text-xs text-blue-600 hover:underline">Resend verification email</button>
          )}
          {resent && <p className="text-xs text-green-600">Verification email resent (if account exists).</p>}
        </form>
        <div className="text-center text-xs text-muted-foreground">
          <span>By continuing, you agree to our </span>
          <Link href="/terms" className="underline">Terms</Link>
          <span> and </span>
          <Link href="/privacy" className="underline">Privacy Policy</Link>
          .
        </div>
      </div>
    </div>
  );
}
