import { FollowButton } from '@/app/components/follow-button';
import { PostInteractions } from '@/app/components/post-interactions';
import { getServerClient } from '@/lib/supabaseServer';
import { cn } from '@/lib/utils';
import { Bell, Bookmark, Hash, Home, Shield, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '../../components/ui/button';

const navigation = [
	{ name: 'Home', icon: Home, path: '/feed' },
	{ name: 'Profile', icon: UserIcon, path: '/profile' },
	{ name: 'Notifications', icon: Bell, path: '/notifications' },
	{ name: 'Bookmarks', icon: Bookmark, path: '/bookmarks' },
	{ name: 'Explore', icon: Hash, path: '/explore' },
];

export const dynamic = 'force-dynamic'; // ensure fresh stats

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
	const supabase = await getServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect('/auth/login');
	const targetId = params.id;
	const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', targetId).single();
	if (error || !profile) return <div className="p-10">Profile not found</div>;

	const isSelf = user.id === targetId;

	// Determine if current viewer (user) is admin
	let viewerIsAdmin = false;
	if (user) {
		const { data: viewerProfile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
		viewerIsAdmin = !!viewerProfile?.is_admin;
	}

	// Only run live COUNT queries for self (RLS may hide others' relationships) – fallback to stored columns for others
	let postsCount = profile.posts_count || 0;
	let followersCount = profile.followers_count || 0;
	let followingCount = profile.following_count || 0;

	if (isSelf) {
		const [postsRes, followersRes, followingRes] = await Promise.all([
			supabase.from('posts').select('*', { count: 'exact', head: true }).eq('author', targetId),
			supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following', targetId),
			supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower', targetId),
		]);
		postsCount = postsRes.count ?? postsCount;
		followersCount = followersRes.count ?? followersCount;
		followingCount = followingRes.count ?? followingCount;
	}

	// Fetch user's posts (latest 20)
	const { data: userPosts } = await supabase
		.from('posts')
		.select('id, content, image_url, created_at')
		.eq('author', targetId)
		.order('created_at', { ascending: false })
		.limit(20);

	// Preload like & comment counts + liked state for viewer
	let likeCounts: Record<string, number> = {};
	let commentCounts: Record<string, number> = {};
	let likedSet = new Set<string>();
	if (userPosts && userPosts.length) {
		const ids = userPosts.map((p) => p.id);
		const { data: likesRows } = await supabase.from('likes').select('post_id').in('post_id', ids as string[]);
		likesRows?.forEach((r) => {
			if (r.post_id) likeCounts[r.post_id] = (likeCounts[r.post_id] || 0) + 1;
		});
		const { data: viewerLikes } = await supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', ids as string[]);
		viewerLikes?.forEach((l) => likedSet.add(l.post_id));
		const { data: commentRows } = await supabase.from('comments').select('post_id').in('post_id', ids as string[]);
		commentRows?.forEach((r) => {
			if (r.post_id) commentCounts[r.post_id] = (commentCounts[r.post_id] || 0) + 1;
		});
	}

	return (
		<div className="flex w-full min-h-screen">
			{/* Sidebar */}
			<aside className="hidden lg:flex lg:w-64 lg:flex-col border-r border-sidebar-border bg-sidebar">
				<div className="flex flex-col flex-grow overflow-y-auto pt-6">
					<nav className="flex-1 px-4 space-y-2">
						{navigation.map((item) => (
							<Button
								key={item.name}
								asChild
								variant={isSelf && item.path === '/profile' ? 'secondary' : 'ghost'}
								className={cn('w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground', isSelf && item.path === '/profile' && 'bg-sidebar-accent text-sidebar-accent-foreground')}
							>
								<Link href={item.path} className="flex items-center">
									<item.icon className="mr-3 h-5 w-5" />
									{item.name}
								</Link>
							</Button>
						))}
						{viewerIsAdmin && (
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
					<div className="p-4 border-t border-sidebar-border text-xs text-center text-sidebar-foreground/70">© {new Date().getFullYear()} SocialConnect</div>
				</div>
			</aside>

			{/* Content */}
			<main className="flex-1 px-6 py-10">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-start gap-6">
						<div className="w-28 h-28 rounded-full bg-muted overflow-hidden flex items-center justify-center">
							{profile.avatar_url ? (
								<Image src={profile.avatar_url} alt={profile.username || 'avatar'} width={112} height={112} className="object-cover w-full h-full" />
							) : (
								<span className="text-3xl font-semibold text-muted-foreground">{profile.username?.[0]?.toUpperCase() || 'U'}</span>
							)}
						</div>
						<div className="flex-1 space-y-3">
							<div>
								<h1 className="text-2xl font-semibold">{profile.username || 'User'}</h1>
								{profile.bio && <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">{profile.bio}</p>}
							</div>
							<div className="flex gap-6 text-sm text-muted-foreground">
								<span>
									<strong className="text-foreground">{postsCount}</strong> Posts
								</span>
								<span>
									<strong className="text-foreground">{followersCount}</strong> Followers
								</span>
								<span>
									<strong className="text-foreground">{followingCount}</strong> Following
								</span>
							</div>
							<div className="flex gap-4 items-center">
								{isSelf ? (
									<Link href="/profile" className="text-sm font-medium text-primary hover:underline">
										Edit Profile
									</Link>
								) : (
									<FollowButton targetId={targetId} />
								)}
							</div>
							{(profile.website || profile.location) && (
								<div className="flex flex-wrap gap-4 pt-2 text-xs text-muted-foreground">
									{profile.website && (
										<a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
											{profile.website.replace(/^https?:\/\//, '')}
										</a>
									)}
									{profile.location && <span>{profile.location}</span>}
								</div>
							)}
						</div>
					</div>
					<div className="mt-10 border-t pt-6 space-y-6">
						{userPosts?.length ? (
							userPosts.map((p) => (
								<div key={p.id} className="border rounded-md p-4 bg-card">
									<div className="flex items-start justify-between mb-2">
										<p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
									</div>
									<p className="text-sm whitespace-pre-wrap mb-3">{p.content}</p>
									{p.image_url && (
										<div className="rounded-md overflow-hidden mb-3">
											<img src={p.image_url} alt="Post image" className="w-full h-auto object-cover max-h-80" />
										</div>
									)}
									<PostInteractions
										postId={p.id}
										initialLikes={likeCounts[p.id] || 0}
										initiallyLiked={likedSet.has(p.id)}
										initialComments={commentCounts[p.id] || 0}
									/>
								</div>
							))
						) : (
							<p className="text-sm text-muted-foreground">No posts yet.</p>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
