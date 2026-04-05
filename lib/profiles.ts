import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { getSafeRedirectPath, requireUser } from "@/lib/auth";
import type { Profile } from "@/lib/profile-shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const PROFILE_SELECT = "id, display_name, created_at, updated_at";
export const MAX_DISPLAY_NAME_LENGTH = 20;

function normalizeDisplayName(value: string) {
  return value.trim();
}

export function hasDisplayName(value?: string | null) {
  return Boolean(value?.trim());
}

export function hasCompletedProfile(
  profile?: Pick<Profile, "display_name"> | null,
) {
  return hasDisplayName(profile?.display_name);
}

export function validateDisplayName(value: string) {
  const displayName = normalizeDisplayName(value);

  if (!displayName) {
    return {
      displayName,
      error: "ニックネームを入力してください。",
    };
  }

  if (displayName.length > MAX_DISPLAY_NAME_LENGTH) {
    return {
      displayName,
      error: `ニックネームは${MAX_DISPLAY_NAME_LENGTH}文字以内で入力してください。`,
    };
  }

  return {
    displayName,
    error: null,
  };
}

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const [supabase, user] = await Promise.all([
    createServerSupabaseClient(),
    requireUser(),
  ]);

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Profile | null;
});

export async function getCurrentDisplayName() {
  const [profile, user] = await Promise.all([getCurrentProfile(), requireUser()]);
  const displayName = profile?.display_name;
  return hasDisplayName(displayName) ? displayName : user.email ?? user.id;
}

export async function redirectToProfileSetupIfNeeded(nextPath = "/") {
  const profile = await getCurrentProfile();

  if (!hasCompletedProfile(profile)) {
    const safeNextPath = getSafeRedirectPath(nextPath);
    redirect(`/profile/setup?next=${encodeURIComponent(safeNextPath)}`);
  }

  return profile;
}
