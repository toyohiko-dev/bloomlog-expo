import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./shared";

export function createClientSupabaseClient() {
  const { url, anonKey } = getSupabaseEnv();
  return createBrowserClient(url, anonKey);
}
