"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSafeRedirectPath, requireUser } from "@/lib/auth";
import type { ProfileFormState } from "@/lib/profile-shared";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  MAX_DISPLAY_NAME_LENGTH,
  getCurrentProfile,
  validateDisplayName,
} from "@/lib/profiles";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateProfileViews() {
  revalidatePath("/", "layout");
  revalidatePath("/profile");
  revalidatePath("/profile/setup");
}

export async function saveProfileAction(
  _previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const [supabase, user] = await Promise.all([
    createServerSupabaseClient(),
    requireUser(),
  ]);
  const nicknameInput = readText(formData, "nickname");
  const { displayName, error } = validateDisplayName(nicknameInput);

  if (error) {
    return {
      status: "error",
      message: `ニックネームは必須で、${MAX_DISPLAY_NAME_LENGTH}文字以内です。`,
      displayName,
      fieldErrors: {
        nickname: error,
      },
    };
  }

  const existingProfile = await getCurrentProfile();
  const { error: saveError } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
    },
    {
      onConflict: "id",
    },
  );

  if (saveError) {
    return {
      status: "error",
      message: saveError.message,
      displayName,
      fieldErrors: {},
    };
  }

  revalidateProfileViews();

  return {
    status: "success",
    message: existingProfile
      ? "ニックネームを更新しました。"
      : "ニックネームを設定しました。",
    displayName,
    fieldErrors: {},
  };
}

export async function saveProfileSetupAction(
  previousState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const result = await saveProfileAction(previousState, formData);

  if (result.status === "error") {
    return result;
  }

  const nextPath = getSafeRedirectPath(readText(formData, "next"));
  redirect(nextPath);
}
