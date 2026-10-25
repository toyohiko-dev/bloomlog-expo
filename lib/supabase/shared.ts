import { createClient } from "@supabase/supabase-js";



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

export function getActivityPhotoUrl(activityLogId: string) {
  return "/api/activity-photo?id="+encodeURIComponent(activityLogId);
}

export function getPavilionImageUrl(imagePath: string) {
  if (/^https?:\/\//.test(imagePath)) {
    return imagePath;
  }

  if (imagePath.startsWith("/")) {
    return imagePath;
  }

  const { url } = getSupabaseEnv();
  const normalizedPath = imagePath.replace(/^\/+/, "");

  if (normalizedPath.startsWith("storage/v1/object/public/")) {
    return `${url}/${normalizedPath}`;
  }

  return `/${normalizedPath}`;
}
