import { getSupabase } from "./supabase";

const BUCKET = "doxpro-assets";

/**
 * Upload data URL (e.g. logo base64) ke Supabase Storage.
 * Path konvensi: {userId}/{kind}/{filename}.
 * Return public URL atau throw kalau gagal.
 */
export async function uploadDataUrl(
  dataUrl: string,
  kind: "logo" | "signature" | "pdf",
  filename: string,
): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Cloud belum dikonfigurasi");

  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user.id;
  if (!userId) throw new Error("Belum login");

  // Convert data URL → Blob
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Format data URL tidak valid");
  const mime = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });

  const path = `${userId}/${kind}/${filename}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: mime });
  if (error) throw error;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

/**
 * Upload arbitrary Blob (e.g. PDF backup) ke storage.
 */
export async function uploadBlob(
  blob: Blob,
  kind: "logo" | "signature" | "pdf",
  filename: string,
): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error("Cloud belum dikonfigurasi");

  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user.id;
  if (!userId) throw new Error("Belum login");

  const path = `${userId}/${kind}/${filename}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: blob.type });
  if (error) throw error;

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}

export const STORAGE_BUCKET = BUCKET;
