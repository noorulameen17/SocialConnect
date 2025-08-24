import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

function sanitizeProfile(p: any) {
  if (!p) return null;
  return {
    id: p.id,
    username: p.username,
    bio: p.bio,
    avatar_url: p.avatar_url,
    website: p.website,
    location: p.location,
    privacy: p.privacy,
    followers_count: p.followers_count || 0,
    following_count: p.following_count || 0,
    posts_count: p.posts_count || 0,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
}

export async function GET() {
  const supabase = await createRouteClient();
  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ profile: sanitizeProfile(data) });
}

export async function PATCH(req: Request) {
  const supabase = await createRouteClient();
  const { data: { user }, error: uErr } = await supabase.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const body = await req.json();
  const updates: any = {};
  if (body.bio !== undefined) {
    if (String(body.bio).length > 160) return NextResponse.json({ error: 'Bio too long' }, { status: 400 });
    updates.bio = body.bio;
  }
  if (body.website !== undefined) {
    const w = String(body.website).trim();
    if (w && !/^https?:\/\//i.test(w)) return NextResponse.json({ error: 'Website must start with http(s)://' }, { status: 400 });
    if (w.length > 200) return NextResponse.json({ error: 'Website too long' }, { status: 400 });
    updates.website = w;
  }
  if (body.location !== undefined) {
    const loc = String(body.location).trim();
    if (loc.length > 120) return NextResponse.json({ error: 'Location too long' }, { status: 400 });
    updates.location = loc;
  }
  if (body.privacy !== undefined) {
    const val = body.privacy;
    if (!['public','private','followers_only'].includes(val)) return NextResponse.json({ error: 'Invalid privacy' }, { status: 400 });
    updates.privacy = val;
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  return NextResponse.json({ profile: sanitizeProfile(refreshed) });
}
