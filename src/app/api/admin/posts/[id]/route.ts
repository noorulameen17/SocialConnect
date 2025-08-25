import { NextResponse } from 'next/server';
import { requireAdmin } from '../../_utils';

type AsyncParams = { params: Promise<{ id: string }> };

// DELETE /api/admin/posts/[id]
export async function DELETE(_req: Request, context: AsyncParams) {
  const { id } = await context.params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === 'Forbidden' ? 403 : 401 });
  const { supabase, user: admin } = auth;
  const { data: existing } = await supabase.from('posts').select('author').eq('id', id).single();
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (existing?.author) {
    const { data: prof } = await supabase.from('profiles').select('posts_count').eq('id', existing.author).single();
    if (prof) await supabase.from('profiles').update({ posts_count: Math.max(0, (prof.posts_count || 1) - 1) }).eq('id', existing.author);
  }
  
  // Make logging non-blocking in case admin_logs table doesn't exist
  try {
    await supabase.from('admin_logs').insert({ admin_id: admin.id, action: 'delete_post', target_type: 'post', target_id: id });
  } catch (logError) {
    console.warn('Failed to log admin action:', logError);
  }
  
  return NextResponse.json({ success: true });
}
