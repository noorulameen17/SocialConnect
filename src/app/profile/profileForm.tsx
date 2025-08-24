"use client";
import { getBrowserClient } from '@/lib/supabaseClient';
import { useRef, useState } from 'react';

interface Profile {
  id: string;
  bio?: string;
  avatar_url?: string;
  website?: string;
  location?: string;
  followers_count?: number;
  following_count?: number;
  posts_count?: number;
  username?: string;
  email?: string;
}

export default function ProfileForm({ profile }: { profile: Profile }) {
  const supabase = getBrowserClient();
  const [bio, setBio] = useState(profile?.bio || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [location, setLocation] = useState(profile?.location || '');
  const [username, setUsername] = useState(profile?.username || ''); // new state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.type)) { setMsg('Invalid image type'); return; }
    if (file.size > 2 * 1024 * 1024) { setMsg('File too large (>2MB)'); return; }
    setMsg(null); setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${profile.id}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: false, cacheControl: '3600', contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pub.publicUrl;
      const { error: updErr } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id);
      if (updErr) throw updErr;
      setAvatarUrl(publicUrl);
      setMsg('Avatar updated');
    } catch (err: any) {
      setMsg(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  }
  async function handleRemoveAvatar() {
    if (!avatarUrl) return;
    if (!confirm('Remove current avatar?')) return;
    setUploading(true); setMsg(null);
    try {
      const { error: updErr } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', profile.id);
      if (updErr) throw updErr;
      setAvatarUrl(null);
      setMsg('Avatar removed');
    } catch (err: any) {
      setMsg(err.message || 'Remove failed');
    } finally { setUploading(false); }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setMsg(null);
    if (bio.length > 160) { setMsg('Bio too long'); setSaving(false); return; }
    if (!username.trim() || username.length < 3) { setMsg('Username min 3 chars'); setSaving(false); return; }
    const { error } = await supabase.from('profiles').update({ bio, website, location, username: username.trim() }).eq('id', profile.id);
    if (error) setMsg(error.message); else setMsg('Saved');
    setSaving(false);
  };

  return (
    <form onSubmit={save} className="space-y-10 max-w-3xl">
      {/* Header / Avatar + Counts */}
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-6">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border shadow-sm">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">No Avatar</span>
              )}
            </div>
          </div>
          <div className="text-sm flex flex-col gap-2 pt-1 min-w-[180px]">
            <span className="font-medium">Avatar</span>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleAvatarChange} disabled={uploading} className="hidden" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="px-3 py-1.5 rounded-md border text-xs font-medium disabled:opacity-50 hover:bg-gray-50">
                {uploading ? 'Uploading...' : avatarUrl ? 'Change Avatar' : 'Upload Avatar'}
              </button>
              {avatarUrl && (
                <button type="button" onClick={handleRemoveAvatar} disabled={uploading} className="px-3 py-1.5 rounded-md border text-xs font-medium disabled:opacity-50 hover:bg-red-50 text-red-600 border-red-300">
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-gray-500">PNG / JPG / WEBP up to 2MB.</p>
            {uploading && <span className="text-xs text-gray-500">Processing...</span>}
          </div>
        </div>
        <div className="flex gap-10 text-center text-sm self-center sm:self-start">
          <div className="min-w-16">
            <p className="font-semibold leading-tight">{profile.posts_count ?? 0}</p>
            <p className="text-gray-500 text-xs">Posts</p>
          </div>
          <div className="min-w-16">
            <p className="font-semibold leading-tight">{profile.following_count ?? 0}</p>
            <p className="text-gray-500 text-xs">Following</p>
          </div>
          <div className="min-w-16">
            <p className="font-semibold leading-tight">{profile.followers_count ?? 0}</p>
            <p className="text-gray-500 text-xs">Followers</p>
          </div>
        </div>
      </div>

      {/* Username */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Username <span className="text-gray-400 font-normal">(unique, min 3 chars)</span></label>
        <input
          type="text"
          value={username}
          onChange={e => setUsername(e.target.value.replace(/\s+/g,'').toLowerCase())}
          placeholder="yourname"
          maxLength={30}
          className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-ring/50 focus:border-ring"
        />
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Bio <span className="text-gray-400 font-normal">(max 160 chars)</span></label>
        <textarea value={bio} maxLength={160} onChange={e => setBio(e.target.value)} className="w-full border rounded-md p-3 h-32 text-sm resize-none focus:ring-2 focus:ring-ring/50 focus:border-ring" />
        <p className="text-xs text-gray-500 text-right">{bio.length}/160</p>
      </div>

      {/* Website & Location */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Website</label>
          <input
            type="url"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://example.com"
            className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-ring/50 focus:border-ring"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, Country"
              className="w-full border rounded-md p-2 text-sm focus:ring-2 focus:ring-ring/50 focus:border-ring"
              maxLength={60}
            />
        </div>
      </div>

      {msg && (
        <p className={`text-sm ${msg.includes('Saved') || msg.includes('updated') ? 'text-green-600' : msg.toLowerCase().includes('error') ? 'text-red-600' : 'text-gray-700'}`}>{msg}</p>
      )}

      <div className="flex gap-4">
        <button disabled={saving} className="bg-black text-white px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:bg-black/90 transition-colors">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => { setBio(profile?.bio || ''); setWebsite(profile?.website || ''); setLocation(profile?.location || ''); setUsername(profile?.username || ''); setMsg(null); }}
          className="px-6 py-2.5 rounded-md border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
