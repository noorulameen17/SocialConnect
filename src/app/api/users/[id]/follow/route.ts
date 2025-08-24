import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

type AsyncParams = { params: Promise<{ id: string }> };

// Helper to recalc counts
async function recalcCounts(supabase: any, followerId: string, followeeId: string) {
  const [{ count: followerFollowing }, { count: followeeFollowers }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower', followerId),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following', followeeId),
  ]);
  await Promise.all([
    supabase.from('profiles').update({ following_count: followerFollowing || 0 }).eq('id', followerId),
    supabase.from('profiles').update({ followers_count: followeeFollowers || 0 }).eq('id', followeeId),
  ]);
  return { following_count: followerFollowing || 0, followers_count: followeeFollowers || 0 };
}

// POST follow
export async function POST(_req: Request, ctx: AsyncParams) {
  const { id: targetId } = await ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!targetId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  if (targetId === user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 });
  // Active checks
  const { data: viewerProfile } = await supabase.from('profiles').select('active').eq('id', user.id).single();
  if (viewerProfile?.active === false) return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });
  const { data: targetProfile } = await supabase.from('profiles').select('active, privacy').eq('id', targetId).single();
  if (targetProfile?.active === false) return NextResponse.json({ error: 'User unavailable' }, { status: 404 });
  if (targetProfile?.privacy === 'private') return NextResponse.json({ error: 'Private account' }, { status: 403 });

  const { error } = await supabase.from('follows').insert({ follower: user.id, following: targetId });
  if (error && !/duplicate key/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!error) {
    await supabase.from('notifications').insert({
      recipient: targetId,
      actor: user.id,
      type: 'follow',
      is_read: false,
      message: 'started following you'
    }).select('id');
  }
  const counts = await recalcCounts(supabase, user.id, targetId);
  const { data: actorProfile } = await supabase.from('profiles').select('id, username, avatar_url').eq('id', user.id).single();
  return NextResponse.json({ status: 'followed', actor: actorProfile, ...counts });
}

// DELETE unfollow
export async function DELETE(_req: Request, ctx: AsyncParams) {
  const { id: targetId } = await ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!targetId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  if (targetId === user.id) return NextResponse.json({ error: 'Cannot unfollow yourself' }, { status: 400 });
  const { data: viewerProfile } = await supabase.from('profiles').select('active').eq('id', user.id).single();
  if (viewerProfile?.active === false) return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });

  await supabase.from('follows').delete().eq('follower', user.id).eq('following', targetId);
  const counts = await recalcCounts(supabase, user.id, targetId);
  return NextResponse.json({ status: 'unfollowed', ...counts });
}

// GET follow status & counts
export async function GET(_req: Request, ctx: AsyncParams) {
  const { id: targetId } = await ctx.params;
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!targetId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  if (targetId === user.id) {
    const [{ count: myFollowing }, { count: myFollowers }] = await Promise.all([
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower', user.id),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following', user.id),
    ]);
    return NextResponse.json({ is_following: false, following_count: myFollowing || 0, followers_count: myFollowers || 0 });
  }

  const { data: existing } = await supabase
    .from('follows')
    .select('follower')
    .eq('follower', user.id)
    .eq('following', targetId)
    .maybeSingle();

  const [{ count: userFollowing }, { count: targetFollowers }] = await Promise.all([
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower', user.id),
    supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following', targetId),
  ]);

  return NextResponse.json({
    is_following: !!existing,
    following_count: userFollowing || 0,
    followers_count: targetFollowers || 0,
  });
}
