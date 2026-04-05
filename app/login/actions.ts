"use server";

import { redirect } from "next/navigation";
import { getAuthCallbackURL, getSafeRedirectPath } from "@/lib/auth";
import type { LoginFormState } from "@/app/login/form-state";
import { createServerSupabaseClient } from "@/lib/supabase";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestMagicLinkAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = readText(formData, "email");
  const nextPath = getSafeRedirectPath(readText(formData, "next"));

  if (!email) {
    return {
      status: "error",
      message: "メールアドレスを入力してください。",
    };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getAuthCallbackURL(nextPath),
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  return {
    status: "success",
    message: "Magic Link を送信しました。メールを確認してください。",
  };
}

export async function signInWithGoogleAction(formData: FormData) {
  const nextPath = getSafeRedirectPath(readText(formData, "next"));
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthCallbackURL(nextPath),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=oauth");
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
