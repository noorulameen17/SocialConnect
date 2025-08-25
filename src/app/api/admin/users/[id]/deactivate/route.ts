import { NextResponse } from 'next/server';
import { requireAdmin } from '../../../_utils';

type AsyncParams = { params: Promise<{ id: string }> };

// POST /api/admin/users/[id]/deactivate  { active?: boolean }
export async function POST(req: Request, context: AsyncParams) {
  const { id } = await context.params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
  const { supabase, user } = auth;
  if (user.id === id) return NextResponse.json({ error: 'Cannot modify self' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const active = body.active === true ? true : false; // default deactivate unless explicitly true
  const { data, error } = await supabase
    .from('profiles')
    .update({ active })
    .eq('id', id)
    .select('id, active')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  
  // Make logging non-blocking in case admin_logs table doesn't exist
  try {
    await supabase.from('admin_logs').insert({ admin_id: user.id, action: active ? 'reactivate_user' : 'deactivate_user', target_type: 'user', target_id: id });
  } catch (logError) {
    console.warn('Failed to log admin action:', logError);
  }
  
  return NextResponse.json({ user: data });
}
