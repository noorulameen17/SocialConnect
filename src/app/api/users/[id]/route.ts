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

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = await createRouteClient();
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { data: { user: viewer } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  if (data) {
    if (data.active === false) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (data.privacy === 'private' && (!viewer || viewer.id !== id)) {
      return NextResponse.json({ error: 'Private profile' }, { status: 403 });
    }
    if (data.privacy === 'followers_only' && (!viewer || viewer.id !== id)) {
      const { data: rel } = await supabase.from('follows').select('follower').eq('follower', viewer?.id).eq('following', id).maybeSingle();
      if (!rel) return NextResponse.json({ error: 'Restricted profile' }, { status: 403 });
    }
  }
  return NextResponse.json({ profile: sanitizeProfile(data) });
}
