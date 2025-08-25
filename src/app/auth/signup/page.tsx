"use client";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  // Removed direct supabase client usage; API handles auth + profile creation
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [form, setForm] = useState({ email: '', password: '', username: '' });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  function validate(): string | null {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) return 'Invalid email';
    if (form.password.length < 6) return 'Password must be at least 6 characters';
    if (!/^\w{3,30}$/.test(form.username)) return 'Username must be 3-30 chars (letters, numbers, underscore)';
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email.trim(), password: form.password, username: form.username.trim() })
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Registration failed');
      } else {
        setSuccess(json.message || 'Registered');
        // Give slight delay then redirect (session may need time if email confirmation disabled)
        setTimeout(() => router.push('/'), 800);
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline">← Home</Link>
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">Already have an account? Sign in</Link>
        </div>
        <h1 className="text-3xl font-bold text-center">Create your account</h1>
        <form onSubmit={submit} className="space-y-4 bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="space-y-2">
            <input name="email" type="email" required placeholder="Email" value={form.email} onChange={onChange} className="w-full border px-3 py-2 rounded" />
            <input name="username" required placeholder="Username" value={form.username} onChange={onChange} className="w-full border px-3 py-2 rounded" />
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
            <span>{loading ? 'Creating...' : 'Create account'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
