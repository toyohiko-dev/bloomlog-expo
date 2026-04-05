"use client";

import { signInWithGoogleAction } from "@/app/login/actions";

export function LoginForm({ nextPath }: { nextPath: string }) {
  return (
    <div className="space-y-5">
      <form action={signInWithGoogleAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          Googleでログイン
        </button>
      </form>

      <p className="text-center text-xs leading-5 text-slate-500">
        無料運用のため、現在は Google ログインのみ対応しています。
      </p>
    </div>
  );
}
