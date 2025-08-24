import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { id } = await params;
  const commentId = id;
  const { data: existing, error: exErr } = await supabase.from('comments').select('author').eq('id', commentId).single();
  if (exErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.author !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: 'Deleted' });
}
