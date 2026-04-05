import { createClient } from "@supabase/supabase-js";

const ACTIVITY_PHOTO_BUCKET = "activity-photos";

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return { url, anonKey };
}

export function createPublicSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();

  return createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getActivityPhotoUrl(photoPath: string) {
  const { url } = getSupabaseEnv();
  return `${url}/storage/v1/object/public/${ACTIVITY_PHOTO_BUCKET}/${photoPath}`;
}
