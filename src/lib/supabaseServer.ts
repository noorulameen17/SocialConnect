import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side Supabase client (App Router) using @supabase/ssr
export async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try { cookieStore.set({ name, value, ...options }); } catch { /* no-op */ }
        },
        remove(name: string, options: any) {
          try { cookieStore.set({ name, value: '', ...options, maxAge: 0 }); } catch { /* no-op */ }
        },
      },
    }
  );
}
