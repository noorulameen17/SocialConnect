import { getServerClient } from '@/lib/supabaseServer';
import { cn } from '@/lib/utils';
import { Bell, Home, Shield, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '../components/ui/button';
import ProfileForm from './profileForm';
import { UserPostsList } from './user-posts-list';

const navigation = [
	{ name: 'Home', icon: Home, path: '/feed' },
	{ name: 'Profile', icon: UserIcon, path: '/profile' },
	{ name: 'Notifications', icon: Bell, path: '/notifications' },
];

export default async function ProfilePage() {
	const supabase = await getServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) redirect('/auth/login');
	const [{ data: profile }, { data: posts }] = await Promise.all([
		supabase.from('profiles').select('*').eq('id', user.id).single(),
		supabase
			.from('posts')
			.select('id, content, image_url, created_at')
			.eq('author', user.id)
			.order('created_at', { ascending: false })
			.limit(50),
	]);
	const isAdmin = !!profile?.is_admin;
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
								variant={item.path === '/profile' ? 'secondary' : 'ghost'}
								className={cn(
									'w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
									item.path === '/profile' &&
										'bg-sidebar-accent text-sidebar-accent-foreground'
								)}
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
					<div className="p-4 border-t border-sidebar-border text-xs text-center text-sidebar-foreground/70">
						© {new Date().getFullYear()} SocialConnect
					</div>
				</div>
			</aside>

			{/* Content */}
			<main className="flex-1 px-6 py-10">
				<h1 className="text-2xl font-semibold mb-8">Edit Profile</h1>
				<ProfileForm profile={profile} />
				<div className="mt-14">
					<h2 className="text-xl font-semibold mb-4">Your Posts</h2>
					<UserPostsList initialPosts={posts || []} />
				</div>
			</main>
		</div>
	);
}
