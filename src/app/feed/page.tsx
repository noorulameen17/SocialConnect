import { getServerClient } from '@/lib/supabaseServer';
import { cn } from '@/lib/utils';
import { Bell, Home, Shield, Sparkles, TrendingUp, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { FollowButton } from '../components/follow-button';
import { LogoutForm } from '../components/logout-form';
import { NotificationBell } from '../components/notification-bell';
import { PostInteractions } from '../components/post-interactions';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

export const dynamic = 'force-dynamic';

const navigation = [
	{ name: 'Home', icon: Home, path: '/feed' },
	{ name: 'Profile', icon: UserIcon, path: '/profile' },
	{ name: 'Notifications', icon: Bell, path: '/notifications' },
];

export default async function FeedPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Parallel fetches (added unread notifications count & is_admin)
  const [selfProfileRes, postsRes, postsCountRes, followingCountRes, followersCountRes, suggestionsRes, unreadRes] = await Promise.all([
    supabase.from('profiles').select('avatar_url, username, is_admin').eq('id', user.id).single(),
    supabase.from('posts').select('id, content, image_url, created_at, author').order('created_at', { ascending: false }).limit(50),
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author', user.id),
    supabase.from('follows').select('following', { count: 'exact', head: true }).eq('follower', user.id),
    supabase.from('follows').select('follower', { count: 'exact', head: true }).eq('following', user.id),
    supabase.from('profiles').select('id, username, avatar_url').neq('id', user.id).order('created_at', { ascending: false }).limit(5),
    supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('recipient', user.id).eq('is_read', false)
  ]);
  const selfProfile = selfProfileRes.data;
  const isAdmin = !!selfProfile?.is_admin;
  const posts = postsRes.data; const error = postsRes.error;
  const postsCount = postsCountRes.count || 0;
  const followingCount = followingCountRes.count || 0;
  const followersCount = followersCountRes.count || 0;
  const suggestions = suggestionsRes.data || [];
  const unreadCount = unreadRes.count || 0;

  // After fetching posts, gather like & comment counts + liked state for current user
  let likeCounts: Record<string, number> = {}; let commentCounts: Record<string, number> = {}; let likedSet = new Set<string>();
  if (posts && posts.length) {
    const ids = posts.map(p => p.id);
    const [{ data: likesAgg }, { data: userLikes }, { data: commentsAgg }] = await Promise.all([
      supabase.from('likes').select('post_id, count:post_id', { count: 'exact', head: false }).in('post_id', ids as string[]),
      supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', ids as string[]),
      supabase.from('comments').select('post_id, count:post_id', { count: 'exact', head: false }).in('post_id', ids as string[])
    ]);
    likesAgg?.forEach((row: any) => { if (row.post_id) likeCounts[row.post_id] = (likeCounts[row.post_id] || 0) + 1; });
    userLikes?.forEach(l => likedSet.add(l.post_id));
    commentsAgg?.forEach((row: any) => { if (row.post_id) commentCounts[row.post_id] = (commentCounts[row.post_id] || 0) + 1; });
  }

  // Fetch associated author profiles (username, avatar)
  let profileMap = new Map<string, { username: string | null; avatar_url: string | null }>();
  if (posts && posts.length) {
    const authorIds = Array.from(new Set(posts.map(p => p.author).filter(Boolean)));
    if (authorIds.length) {
      const { data: authorProfiles } = await supabase.from('profiles').select('id, username, avatar_url').in('id', authorIds as string[]);
      authorProfiles?.forEach(ap => { profileMap.set(ap.id, { username: ap.username, avatar_url: ap.avatar_url }); });
    }
  }

  // Trending hashtags extracted from current posts
  let hashtagCounts: Record<string, number> = {};
  posts?.forEach(p => {
    const matches = p.content.match(/#\w+/g);
    if (matches) matches.forEach((tag: string) => { const lower = tag.toLowerCase(); hashtagCounts[lower] = (hashtagCounts[lower] || 0) + 1; });
  });
  const trendingTags = Object.entries(hashtagCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

  return (
    <div className="min-h-screen bg-background text-black flex w-full flex-col">
      {/* Feed Header */}
			<header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div className="flex h-16 items-center justify-between px-6 w-full">
		<div className="flex items-center space-x-2">
			<Link href="/feed" className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center" aria-label="Home">
				<span className="text-accent-foreground font-bold text-sm">SC</span>
			</Link>
			<Link href="/feed" className="text-xl font-bold hover:underline">SocialConnect</Link>
		</div>
		<div className="flex items-center space-x-4">
				<NotificationBell userId={user.id} initialUnread={unreadCount} />
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="User menu">
						<Avatar className="h-8 w-8">
							<AvatarImage src={selfProfile?.avatar_url || '/placeholder.svg'} alt={user.email || 'User'} />
							<AvatarFallback>{user.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
						</Avatar>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent className="w-56" align="end" forceMount>
					<DropdownMenuLabel className="font-normal">
						<div className="flex flex-col space-y-1">
							<p className="text-sm font-medium leading-none">{user.email || 'User'}</p>
							<p className="text-xs leading-none text-gray-500">Account</p>
						</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
						<Link href="/profile">Profile</Link>
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem asChild>
            <LogoutForm />
          </DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	</div>
</header>

			<div className="flex flex-1 w-full">{/* wrapper for sidebar + content */}
				{/* Sidebar */}
				<aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-sidebar-border">
					<div className="flex flex-col flex-grow bg-sidebar overflow-y-auto pt-6">
						<nav className="flex-1 px-4 space-y-2">
							{navigation.map((item) => (
								<Button
									key={item.name}
									asChild
									variant={item.path === '/feed' ? 'secondary' : 'ghost'}
									className={cn('w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', item.path === '/feed' && 'bg-sidebar-accent text-sidebar-accent-foreground')}
								>
								  <Link href={item.path} className="flex items-center">
									<item.icon className="mr-3 h-5 w-5" />
									{item.name}
								  </Link>
								</Button>
							))}
							{isAdmin && (
                <Button
                  asChild
                  variant="ghost"
                  className={cn('w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground')}
                >
                  <Link href="/admin" className="flex items-center">
                    <Shield className="mr-3 h-5 w-5" />
                    Admin
                  </Link>
                </Button>
              )}
						</nav>
						<div className="p-4">
							<Link href="/new-post" className="block">
								<Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Create Post</Button>
							</Link>
						</div>
					</div>
				</aside>

				{/* Content */}
				<main className="flex-1 w-full">
					<div className="px-4 sm:px-8 py-8">
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-semibold">Global Feed</h2>
							<Link href="/new-post" className="text-sm text-blue-600 hover:underline">New Post</Link>
						</div>
						{error && <p className="text-sm text-red-600 mb-4">{error.message}</p>}
						<ul className="space-y-6">
							{posts?.map(p => (
							<li key={p.id}>
								<Card className="bg-card border-border hover:shadow-md transition-shadow duration-200">
									<CardHeader className="pb-3">
										<div className="flex items-start justify-between">
											<div className="flex items-center space-x-3">
												{(() => { const prof = profileMap.get(p.author); return (
												<Link href={`/users/${p.author}`} className="shrink-0">
													<Avatar className="h-10 w-10">
														<AvatarImage src={prof?.avatar_url || '/placeholder.svg'} alt={prof?.username || p.author || 'User'} />
														<AvatarFallback>{(prof?.username || p.author || 'U').toString().substring(0,2).toUpperCase()}</AvatarFallback>
													</Avatar>
												</Link> ); })()}
												<div className="leading-tight">
													<p className="font-semibold text-sm">
														<Link href={`/users/${p.author}`} className="hover:underline">
															{profileMap.get(p.author)?.username || p.author || 'Unknown'}
														</Link>
													</p>
													<p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString()}</p>
												</div>
												{p.author !== user.id && (
													<div className="pl-2">
														<FollowButton targetId={p.author} compact />
													</div>
												)}
											</div>
											<DropdownMenu>
												<DropdownMenuContent align="end">
													<DropdownMenuItem>Save post</DropdownMenuItem>
													<DropdownMenuItem>Copy link</DropdownMenuItem>
													<DropdownMenuItem className="text-destructive">Report</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</div>
									</CardHeader>
									<CardContent className="pt-0 space-y-4">
										<p className="leading-relaxed whitespace-pre-wrap text-sm">{p.content}</p>
										{p.image_url && (
											<div className="rounded-lg overflow-hidden">
												<img src={p.image_url} alt="Post image" className="w-full h-auto object-cover max-h-96" />
											</div>
										)}
										<PostInteractions postId={p.id} initialLikes={likeCounts[p.id] || 0} initiallyLiked={likedSet.has(p.id)} initialComments={commentCounts[p.id] || 0} />
									</CardContent>
								</Card>
							</li>
							))}
						</ul>
						{!posts?.length && !error && <p className="text-sm text-gray-500 mt-6">No posts yet.</p>}
					</div>
				</main>

				{/* Right Sidebar (redesigned) */}
				<aside className="hidden xl:flex xl:w-80 xl:flex-col border-l border-sidebar-border bg-background/60 backdrop-blur px-5 py-8 space-y-8">
          {/* Mini profile with stats */}
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14">
              <AvatarImage src={selfProfile?.avatar_url || '/placeholder.svg'} alt={selfProfile?.username || user.email || 'User'} />
              <AvatarFallback>{(selfProfile?.username || user.email || 'U').substring(0,2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-sm">
              <p className="font-semibold truncate">{selfProfile?.username || user.email?.split('@')[0] || 'You'}</p>
              <div className="mt-2 grid grid-cols-3 gap-3 text-xs">
                <div><p className="font-semibold leading-none">{postsCount}</p><p className="text-gray-500 mt-0.5">Posts</p></div>
                <div><p className="font-semibold leading-none">{followingCount}</p><p className="text-gray-500 mt-0.5">Following</p></div>
                <div><p className="font-semibold leading-none">{followersCount}</p><p className="text-gray-500 mt-0.5">Followers</p></div>
              </div>
            </div>
          </div>

          {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              <Link href="/new-post" className="block"><Button variant="outline" className="w-full h-16 flex flex-col gap-1 text-xs"><Sparkles className="h-4 w-4" />New Post</Button></Link>
              <Link href="/profile" className="block"><Button variant="outline" className="w-full h-16 flex flex-col gap-1 text-xs"><UserIcon className="h-4 w-4" />Profile</Button></Link>
              <Link href="/notifications" className="block col-span-1"><Button variant="outline" className="w-full h-16 flex flex-col gap-1 text-xs"><Bell className="h-4 w-4" />Alerts</Button></Link>
              
            </div>

          {/* Who to follow */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Who to follow</h3>
            </div>
            <ul className="space-y-3">
              {suggestions.map(s => (
                <li key={s.id} className="flex items-center justify-between gap-3">
                  <Link href={`/users/${s.id}`} className="flex items-center gap-3 min-w-0 group">
                    <Avatar className="h-10 w-10"><AvatarImage src={s.avatar_url || '/placeholder.svg'} alt={s.username || 'User'} /><AvatarFallback>{(s.username || 'U').substring(0,2).toUpperCase()}</AvatarFallback></Avatar>
                    <span className="text-sm font-medium truncate group-hover:underline">{s.username || 'User'}</span>
                  </Link>
                  <FollowButton targetId={s.id} compact />
                </li>
              ))}
              {!suggestions.length && <li className="text-xs text-gray-500">No suggestions.</li>}
            </ul>
          </div>

          {/* Trending hashtags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm flex items-center gap-1"><TrendingUp className="h-4 w-4" /> Trending</h3>
            </div>
            <ul className="space-y-2 text-sm">
              {trendingTags.length ? trendingTags.map(([tag,count]) => (
                <li key={tag} className="flex items-center justify-between rounded-md px-3 py-2 border hover:bg-muted transition-colors cursor-pointer">
                  <span className="font-medium truncate">{tag}</span>
                  <span className="text-[10px] text-gray-500/70">{count}</span>
                </li>
              )) : <li className="text-xs text-gray-500">No hashtags yet.</li>}
            </ul>
          </div>

          <p className="text-[10px] text-gray-500 leading-relaxed pt-2 border-t">© {new Date().getFullYear()} SocialConnect</p>
        </aside>
			</div>
		</div>
	);
}
