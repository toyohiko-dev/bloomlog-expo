import "server-only";

import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function normalizeRedirectPath(path?: string | null) {
  if (!path || !path.startsWith("/")) {
    return "/";
  }

  if (path.startsWith("//")) {
    return "/";
  }

  return path;
}

export function getURL(path = "/") {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL;

  const baseUrl = envUrl
    ? envUrl.startsWith("http")
      ? envUrl
      : `https://${envUrl}`
    : "http://localhost:3000";

  return new URL(normalizeRedirectPath(path), `${baseUrl.replace(/\/$/, "")}/`).toString();
}

export function getAuthCallbackURL(nextPath = "/") {
  const callbackURL = new URL(getURL("/auth/callback"));
  callbackURL.searchParams.set("next", normalizeRedirectPath(nextPath));
  return callbackURL.toString();
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
});

export const requireUser = cache(async (): Promise<User> => {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
});

export function getSafeRedirectPath(path?: string | null) {
  return normalizeRedirectPath(path);
}
