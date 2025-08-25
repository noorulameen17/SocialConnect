'use client';
import { createBrowserClient } from '@supabase/ssr';

export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit', // disable PKCE, use hash-based implicit flow
        detectSessionInUrl: true,
        autoRefreshToken: true,
        persistSession: true,
      }
    }
  );
}
