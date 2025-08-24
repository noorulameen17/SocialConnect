import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

type AsyncParams = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: AsyncParams) {
  const { id } = await ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: existing, error: exErr } = await supabase.from('notifications').select('recipient').eq('id', id).single();
  if (exErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.recipient !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: 'Marked read' });
}
