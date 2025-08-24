import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_utils';

// DELETE /api/admin/posts/[id]
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
  const { supabase, user: admin } = auth;
  const { data: existing } = await supabase.from('posts').select('author').eq('id', params.id).single();
  const { error } = await supabase.from('posts').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (existing?.author) {
    const { data: prof } = await supabase.from('profiles').select('posts_count').eq('id', existing.author).single();
    if (prof) await supabase.from('profiles').update({ posts_count: Math.max(0, (prof.posts_count || 1) - 1) }).eq('id', existing.author);
  }
  await supabase.from('admin_logs').insert({ admin_id: admin.id, action: 'delete_post', target_type: 'post', target_id: params.id });
  return NextResponse.json({ success: true });
}
