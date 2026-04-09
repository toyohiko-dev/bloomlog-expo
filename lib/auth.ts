import "server-only";

import type { User } from "@supabase/supabase-js";
import { cache } from "react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { normalizeRedirectPath } from "@/lib/redirect";

function getConfiguredBaseUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_URL;

  if (!envUrl) {
    return null;
  }

  return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
}

export async function getURL(path = "/") {
  const configuredBaseUrl = getConfiguredBaseUrl();

  if (configuredBaseUrl) {
    return new URL(normalizeRedirectPath(path), `${configuredBaseUrl.replace(/\/$/, "")}/`).toString();
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (!host) {
    throw new Error("Site URL is not configured.");
  }

  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return new URL(normalizeRedirectPath(path), `${protocol}://${host}/`).toString();
}

export async function getAuthCallbackURL(nextPath = "/") {
  const callbackURL = new URL(await getURL("/auth/callback"));
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
