import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_utils';

interface RouteParams { params: { id: string } }

// GET /api/admin/users/[id]
export async function GET(_req: Request, context: RouteParams) {
  const { id } = context.params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
  const { supabase } = auth;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, bio, avatar_url, created_at, active, is_admin')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ user: data });
}

// PATCH /api/admin/users/[id]  { is_admin?: boolean, active?: boolean }
export async function PATCH(req: Request, context: RouteParams) {
  const { id } = context.params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
  const { supabase, user: acting } = auth;
  if (acting.id === id) return NextResponse.json({ error: 'Cannot modify own admin status' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const updates: any = {};
  if (body.is_admin !== undefined) updates.is_admin = !!body.is_admin;
  if (body.active !== undefined) updates.active = !!body.active;
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'No fields' }, { status: 400 });
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select('id, is_admin, active').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  // Log action (requires admin_logs table: id, admin_id, action, target_type, target_id, meta json, created_at)
  await supabase.from('admin_logs').insert({
    admin_id: acting.id,
    action: 'update_user',
    target_type: 'user',
    target_id: id,
    meta: updates
  });
  return NextResponse.json({ user: data });
}
