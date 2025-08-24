import { createRouteClient } from '@/lib/supabaseRoute';

export async function requireAdmin() {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' } as const;
  // Expect profiles table has boolean column is_admin (default false)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin, active')
    .eq('id', user.id)
    .single();
  if (error) return { error: 'Profile not found' } as const;
  if (!profile.is_admin) return { error: 'Forbidden' } as const;
  return { supabase, user, profile } as const;
}
