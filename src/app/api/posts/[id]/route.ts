import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

type AsyncParams = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: AsyncParams) {
  const { id } = await ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('posts').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  if (data) {
    const { data: prof } = await supabase.from('profiles').select('privacy, active').eq('id', data.author).single();
    if (prof && (prof.active === false || prof.privacy === 'private') && (!user || user.id !== data.author)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (prof && prof.privacy === 'followers_only' && user && user.id !== data.author) {
      const { data: rel } = await supabase.from('follows').select('follower').eq('follower', user.id).eq('following', data.author).maybeSingle();
      if (!rel) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  return NextResponse.json({ post: data });
}

export async function PATCH(req: Request, ctx: AsyncParams) {
  const { id } = await ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await req.json();
  const updates: any = {};
  if (body.content !== undefined) {
    const c = String(body.content).trim();
    if (!c || c.length > 280) return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    updates.content = c;
  }
  if (body.category !== undefined) {
    if (!['general','announcement','question'].includes(body.category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    updates.category = body.category;
  }
  if (body.image_url !== undefined) updates.image_url = body.image_url;
  if (!Object.keys(updates).length) return NextResponse.json({ error: 'No changes' }, { status: 400 });
  const { data: existing, error: exErr } = await supabase.from('posts').select('author').eq('id', id).single();
  if (exErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.author !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { error } = await supabase.from('posts').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ message: 'Updated' });
}

export async function DELETE(_req: Request, ctx: AsyncParams) {
  const { id } = await ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data: existing, error: exErr } = await supabase.from('posts').select('author').eq('id', id).single();
  if (exErr || !existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.author !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data: prof } = await supabase.from('profiles').select('posts_count').eq('id', user.id).single();
  if (prof) await supabase.from('profiles').update({ posts_count: Math.max(0, (prof.posts_count || 1) - 1) }).eq('id', user.id);
  return NextResponse.json({ message: 'Deleted' });
}
