"use client";
import { Heart, Loader2, MessageCircle, X } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { Button } from './ui/button';

interface Props {
  postId: string;
  initialLikes?: number;
  initiallyLiked?: boolean;
  initialComments?: number; // new
}

export function PostInteractions({ postId, initialLikes = 0, initiallyLiked = false, initialComments = 0 }: Props) {
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [liked, setLiked] = useState(initiallyLiked);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentCount, setCommentCount] = useState(initialComments); // separate count so we can show before loading full list
  const [commentInput, setCommentInput] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false); // new flag to avoid refetch loop when 0 comments
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Fetch comments once when opened
  useEffect(() => {
    if (commentsOpen && !commentsLoaded && !loadingComments) {
      setLoadingComments(true);
      setLoadError(null);
      fetch(`/api/posts/${postId}/comments`)
        .then(r => r.json())
        .then(d => {
          if (d.error) {
            setLoadError(d.error);
          } else if (Array.isArray(d.comments)) {
            setComments(d.comments);
            setCommentCount(d.comments.length); // sync count with fetched list
          }
        })
        .catch(err => setLoadError(err.message || 'Failed to load comments'))
        .finally(() => {
          setLoadingComments(false);
          setCommentsLoaded(true);
        });
    }
  }, [commentsOpen, commentsLoaded, loadingComments, postId]);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    startTransition(async () => {
      const res = await fetch(`/api/posts/${postId}/like`, { method: next ? 'POST' : 'DELETE' });
      if (!res.ok) {
        setLiked(!next);
        setLikeCount(c => c + (next ? -1 : 1));
        return;
      }
      try {
        const data = await res.json();
        if (typeof data.total === 'number') setLikeCount(data.total);
        if (typeof data.liked === 'boolean') setLiked(data.liked);
      } catch {/* ignore parse errors */}
    });
  };

  const submitComment = async () => {
    const text = commentInput.trim();
    if (!text) return;
    const optimistic = { id: `temp-${Date.now()}`, content: text, created_at: new Date().toISOString() };
    setComments(c => [...c, optimistic]);
    setCommentCount(c => c + 1); // increment visible count immediately
    setCommentInput('');
    const res = await fetch(`/api/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content: text }), headers: { 'Content-Type': 'application/json' } });
    const data = await res.json();
    if (!res.ok) {
      // remove optimistic
      setComments(c => c.filter(cm => cm.id !== optimistic.id));
      setCommentCount(c => c - 1); // rollback count
      setCommentInput(text); // restore
      return;
    }
    // Replace optimistic with real comment data if provided
    setComments(c => c.map(cm => cm.id === optimistic.id ? (data.comment || { ...cm, id: data.comment_id }) : cm));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <Button
          variant={liked ? 'secondary' : 'outline'}
          size="sm"
          onClick={toggleLike}
          disabled={isPending}
          className={`gap-2 font-medium border-red-400/40 ${liked ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'text-red-600 hover:bg-red-50'} `}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike post' : 'Like post'}
        >
          <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} />
          <span className="tabular-nums">{likeCount}</span>
        </Button>
        <Button
          variant={commentsOpen ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setCommentsOpen(o => !o)}
          className={`gap-2 font-medium border-blue-400/40 ${commentsOpen ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'text-blue-600 hover:bg-blue-50'}`}
          aria-expanded={commentsOpen}
          aria-label="Toggle comments"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="tabular-nums">{commentCount}</span>
        </Button>
      </div>
      {commentsOpen && (
        <div className="border rounded-md p-3 space-y-3 bg-muted/20">
          <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
            {loadingComments ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading comments...</div>
            ) : loadError ? (
              <div className="text-xs text-destructive">{loadError}</div>
            ) : comments.length ? comments.map(c => (
              <div key={c.id} className="text-xs bg-background/50 border rounded px-2 py-1 flex gap-2 group">
                {c.profile ? (
                  <div className="flex-shrink-0 mt-0.5">
                    <img src={c.profile.avatar_url || '/placeholder.svg'} alt={c.profile.username || 'User'} className="h-5 w-5 rounded-full object-cover" />
                  </div>
                ) : null}
                <div className="flex-1 min-w-0">
                  <p className="whitespace-pre-wrap leading-snug break-words">
                    {c.profile && <span className="font-semibold mr-1">{c.profile.username || c.author?.slice(0,6)}</span>}{c.content}
                  </p>
                  <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleTimeString()}</span>
                </div>
                {/* Delete button if authored by current user (heuristic: compare profile.id or author to window.userId if available) */}
                <button
                  aria-label="Delete comment"
                  onClick={async () => {
                    if(!confirm('Delete this comment?')) return;
                    const targetId = c.id;
                    const prev = comments;
                    setComments(list => list.filter(cm => cm.id !== targetId));
                    setCommentCount(count => count - 1);
                    const res = await fetch(`/api/posts/${postId}/comments?comment_id=${targetId}`, { method: 'DELETE' });
                    if(!res.ok){
                      // rollback
                      setComments(prev);
                      setCommentCount(count => count + 1);
                      try{ const j = await res.json(); alert(j.error || 'Failed to delete'); }catch{ alert('Failed to delete'); }
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )) : <p className="text-xs text-muted-foreground">No comments yet</p>}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={commentInput}
              onChange={e => setCommentInput(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 rounded border bg-background px-2 py-1 text-xs focus:outline-none focus:ring"
              maxLength={200}
            />
            <Button size="sm" disabled={!commentInput.trim()} onClick={submitComment}>Post</Button>
          </div>
        </div>
      )}
    </div>
  );
}
