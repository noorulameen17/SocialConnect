"use client";
import { getBrowserClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { DragEvent, useEffect, useRef, useState } from 'react';

export default function NewPostForm() {
  const router = useRouter();
  const supabase = getBrowserClient();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const maxChars = 280;
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) setFile(f);
  };
  const handleDrag = (e: DragEvent) => { e.preventDefault(); };

  const pickFile = () => fileInputRef.current?.click();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null); setLoading(true);
    let image_url: string | undefined;
    try {
      if (file) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g,'_')}`;
        const { error: uploadErr } = await supabase.storage.from('post-images').upload(path, file, { upsert: false, cacheControl: '3600' });
        if (uploadErr) throw uploadErr;
        const { data: pub } = supabase.storage.from('post-images').getPublicUrl(path);
        image_url = pub.publicUrl;
      }
      const res = await fetch('/api/posts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: content.trim(), image_url }) });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to post');
      }
      setLoading(false);
      router.push('/feed');
    } catch (err: any) {
      setError(err.message || 'Network error');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Content</label>
          <div className="relative">
            <textarea
              value={content}
              maxLength={maxChars}
              onChange={e => setContent(e.target.value)}
              placeholder="What's happening?"
              className="w-full border border-border focus:ring-2 focus:ring-primary/40 rounded-lg p-3 h-40 resize-none bg-background text-sm outline-none"
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-muted-foreground">
              {content.length}/{maxChars}
            </div>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Image (optional)</label>
        <div
          onDrop={handleDrop}
          onDragOver={handleDrag}
          onDragEnter={handleDrag}
          className="border-2 border-dashed rounded-lg p-6 text-center text-sm cursor-pointer hover:border-primary/60 transition-colors"
          onClick={pickFile}
        >
          {preview ? (
            <div className="relative inline-block group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="preview" className="object-cover w-64 h-64 rounded-lg border" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >Remove</button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <span className="font-medium text-foreground">Drag & drop an image</span>
              <span className="text-xs">or click to browse</span>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end gap-3">
        <button type="button" disabled={loading} onClick={() => { setContent(''); setFile(null); setPreview(null); }} className="text-sm px-4 py-2 rounded border border-border hover:bg-muted disabled:opacity-50">Clear</button>
        <button disabled={loading || !content.trim()} className="text-sm px-5 py-2 rounded bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
}
