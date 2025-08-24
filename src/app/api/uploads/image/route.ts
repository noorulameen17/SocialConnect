import { createRouteClient } from '@/lib/supabaseRoute';
import { NextResponse } from 'next/server';

// POST /api/uploads/image  (multipart/form-data: file=<image>)
// Validates JPEG/PNG <=2MB and stores in "post-images" bucket. Bucket must exist and allow public read.
export async function POST(req: Request) {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof Blob)) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  const size = file.size;
  if (size > 2 * 1024 * 1024) return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 });
  const mime = file.type;
  if (!['image/jpeg','image/png'].includes(mime)) return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
  const originalName = (form.get('filename') || (file as any).name || 'upload').toString();
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g,'_');
  const ext = mime === 'image/png' ? '.png' : '.jpg';
  const path = `${user.id}/${Date.now()}-${safeName}${safeName.toLowerCase().endsWith(ext) ? '' : ext}`;

  // Upload
  const arrayBuffer = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage.from('post-images').upload(path, new Uint8Array(arrayBuffer), { contentType: mime, upsert: false });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 400 });
  const { data: pub } = supabase.storage.from('post-images').getPublicUrl(path);
  return NextResponse.json({ url: pub.publicUrl, path });
}
