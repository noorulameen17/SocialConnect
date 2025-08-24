"use client";
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';

interface Post {
  id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
}

export function UserPostsList({ initialPosts }: { initialPosts: Post[] }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts || []);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    setDeletingId(id); setError(null);
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(()=>({}));
        throw new Error(data.error || 'Failed to delete');
      }
      setPosts(p => p.filter(post => post.id !== id));
    } catch (e: any) {
      setError(e.message || 'Error');
    } finally {
      setDeletingId(null);
    }
  }

  if (!posts.length) return <p className="text-sm text-gray-500">No posts yet.</p>;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {posts.map(p => (
        <Card key={p.id} className="border-border bg-card">{/* single post */}
          <CardHeader className="pb-2 flex flex-row items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-gray-500">{new Date(p.created_at).toLocaleString()}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" /> {deletingId === p.id ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{p.content}</p>
            {p.image_url && (
              <div className="rounded-md overflow-hidden">
                <img src={p.image_url} alt="Post image" className="w-full h-auto object-cover max-h-80" />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
