import { getServerClient } from '@/lib/supabaseServer';
import { cookies as nextCookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchJSON(path: string, cookieHeader: string, init?: RequestInit) {
  // Use relative fetch to avoid hitting deployment protection on absolute domain
  const res = await fetch(path, {
    cache: 'no-store',
    headers: {
      ...(init?.headers || {}),
      cookie: cookieHeader,
    },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default async function AdminPage() {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('profiles').select('is_admin, username').eq('id', user.id).single();
  if (!profile?.is_admin) return <div className="max-w-5xl mx-auto p-8"><h1 className="text-xl font-semibold mb-4">Forbidden</h1><p className="text-sm text-gray-600">You are not an administrator.</p></div>;

  const cookieStore = await nextCookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join('; ');

  const [statsResult, usersResult, postsResult] = await Promise.allSettled([
    fetchJSON('/api/admin/stats', cookieHeader),
    fetchJSON('/api/admin/users?page=1&page_size=20', cookieHeader),
    fetchJSON('/api/admin/posts?page=1&page_size=20', cookieHeader),
  ]);

  const statsError = statsResult.status === 'rejected' ? statsResult.reason : null;
  const usersError = usersResult.status === 'rejected' ? usersResult.reason : null;
  const postsError = postsResult.status === 'rejected' ? postsResult.reason : null;

  const stats: any = statsResult.status === 'fulfilled' ? statsResult.value : {};
  const users: any = usersResult.status === 'fulfilled' ? usersResult.value : { users: [] };
  const posts: any = postsResult.status === 'fulfilled' ? postsResult.value : { posts: [] };

  async function DemoteUserForm({ targetId, isAdmin }: { targetId: string; isAdmin: boolean }) {
    return (
      <form action={`/api/admin/users/${targetId}`} method="post" className="inline-block">
        <input type="hidden" name="_method" value="PATCH" />
        <input type="hidden" name="is_admin" value={isAdmin ? 'false' : 'true'} />
        <button className="text-xs text-blue-600 hover:underline" type="submit">{isAdmin ? 'Demote' : 'Promote'}</button>
      </form>
    );
  }

  async function DeactivateUserForm({ targetId, active }: { targetId: string; active: boolean }) {
    return (
      <form action={`/api/admin/users/${targetId}/deactivate`} method="post" className="inline-block ml-2">
        <input type="hidden" name="active" value={active ? 'false' : 'true'} />
        <button className="text-xs text-red-600 hover:underline" type="submit">{active ? 'Deactivate' : 'Reactivate'}</button>
      </form>
    );
  }

  async function DeletePostForm({ postId }: { postId: string }) {
    return (
      <form action={`/api/admin/posts/${postId}`} method="post" className="inline-block">
        <input type="hidden" name="_method" value="DELETE" />
        <button type="submit" className="text-xs text-red-600 hover:underline">Delete</button>
      </form>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link href="/feed" className="text-sm text-blue-600 hover:underline">Back to App</Link>
      </header>

      <section>
        <h2 className="text-lg font-semibold mb-4">Stats</h2>
        {statsError && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            Failed to load stats: {statsError instanceof Error ? statsError.message : String(statsError)}
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-md border bg-white"><p className="text-xs uppercase tracking-wide text-gray-500">Users</p><p className="text-2xl font-semibold">{stats.total_users ?? '—'}</p></div>
          <div className="p-4 rounded-md border bg-white"><p className="text-xs uppercase tracking-wide text-gray-500">Posts</p><p className="text-2xl font-semibold">{stats.total_posts ?? '—'}</p></div>
          <div className="p-4 rounded-md border bg-white"><p className="text-xs uppercase tracking-wide text-gray-500">Active Today</p><p className="text-2xl font-semibold">{stats.active_today ?? '—'}</p></div>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Users</h2>
        </div>
        {usersError && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            Failed to load users: {usersError instanceof Error ? usersError.message : String(usersError)}
          </div>
        )}
        <div className="overflow-x-auto border rounded-md bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Username</th>
                <th className="px-3 py-2 text-left font-medium">Active</th>
                <th className="px-3 py-2 text-left font-medium">Admin</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.users?.map((u: any) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs truncate max-w-[140px]">{u.id}</td>
                  <td className="px-3 py-2">{u.username || '—'}</td>
                  <td className="px-3 py-2">{u.active ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{u.is_admin ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 space-x-2">
                    <DemoteUserForm targetId={u.id} isAdmin={u.is_admin} />
                    <DeactivateUserForm targetId={u.id} active={u.active} />
                  </td>
                </tr>
              ))}
              {!users.users?.length && !usersError && (<tr><td className="px-3 py-6 text-center text-gray-500" colSpan={5}>No users.</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4">Recent Posts</h2>
        {postsError && (
          <div className="mb-4 rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            Failed to load posts: {postsError instanceof Error ? postsError.message : String(postsError)}
          </div>
        )}
        <div className="overflow-x-auto border rounded-md bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">ID</th>
                <th className="px-3 py-2 text-left font-medium">Author</th>
                <th className="px-3 py-2 text-left font-medium">Category</th>
                <th className="px-3 py-2 text-left font-medium">Created</th>
                <th className="px-3 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.posts?.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs truncate max-w-[140px]">{p.id}</td>
                  <td className="px-3 py-2">{p.author}</td>
                  <td className="px-3 py-2">{p.category}</td>
                  <td className="px-3 py-2 text-xs">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <DeletePostForm postId={p.id} />
                  </td>
                </tr>
              ))}
              {!posts.posts?.length && !postsError && (<tr><td className="px-3 py-6 text-center text-gray-500" colSpan={5}>No posts.</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
