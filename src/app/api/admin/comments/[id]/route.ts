import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_utils';

// DELETE /api/admin/comments/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
  const { supabase, user } = auth;
  const { data: existing, error: exErr } = await supabase.from('comments').select('id').eq('id', params.id).single();
  if (exErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { error } = await supabase.from('comments').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await supabase.from('admin_logs').insert({ admin_id: user.id, action: 'delete_comment', target_type: 'comment', target_id: params.id });
  return NextResponse.json({ success: true });
}
