"use server";

import { redirect } from "next/navigation";
import type { LoginFormState } from "@/app/login/form-state";
import { getAuthCallbackURL } from "@/lib/auth";
import { getSafeRedirectPath } from "@/lib/redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function createLoginErrorRedirect(errorCode: string, nextPath = "/") {
  const safeNextPath = getSafeRedirectPath(nextPath);
  const searchParams = new URLSearchParams({ error: errorCode });

  if (safeNextPath !== "/") {
    searchParams.set("next", safeNextPath);
  }

  return `/login?${searchParams.toString()}`;
}

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function requestMagicLinkAction(
  _previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  // Magic Link is intentionally retained for future reuse, but is not exposed in the production login UI.
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
      emailRedirectTo: await getAuthCallbackURL(nextPath),
    },
  });

  if (error) {
    redirect(createLoginErrorRedirect("unexpected", nextPath));
  }

  return {
    status: "success",
    message: "Magic Link を送信しました。",
  };
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
