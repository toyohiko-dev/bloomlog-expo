"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSafeRedirectPath } from "@/lib/redirect";
import { createClientSupabaseClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const supabase = createClientSupabaseClient();
      const callbackURL = new URL("/auth/callback", window.location.origin);
      callbackURL.searchParams.set("next", getSafeRedirectPath(nextPath));

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackURL.toString(),
        },
      });

      if (error) {
        const errorCode = error.message.includes("provider is not enabled")
          ? "google_not_enabled"
          : "unexpected";

        router.push(`/login?error=${errorCode}&next=${encodeURIComponent(getSafeRedirectPath(nextPath))}`);
        return;
      }
    } catch {
      setErrorMessage("ログイン処理に失敗しました。もう一度お試しください。");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          {isLoading ? "Googleへ移動中..." : "Googleでログイン"}
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <p className="text-center text-xs leading-5 text-slate-500">
        無料運用のため、現在は Google ログインのみ対応しています。
      </p>
    </div>
  );
}
