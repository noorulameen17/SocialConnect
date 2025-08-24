import { getServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import NewPostForm from './postForm';

export default async function NewPostPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  return (
    <div className="min-h-screen w-full bg-background/50 py-10 px-4 flex justify-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Create a new post</h1>
            <p className="text-sm text-muted-foreground mt-1">Share a thought, ask a question, or make an announcement.</p>
          </div>
          <Link href="/feed" className="text-sm text-blue-600 hover:underline">← Back to feed</Link>
        </div>
        <NewPostForm />
        <p className="text-[10px] text-muted-foreground text-center">Remember: Be respectful and follow the community guidelines.</p>
      </div>
    </div>
  );
}
