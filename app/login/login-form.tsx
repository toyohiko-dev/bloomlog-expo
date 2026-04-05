"use client";

import { useActionState } from "react";
import {
  requestMagicLinkAction,
  signInWithGoogleAction,
} from "@/app/login/actions";
import { initialLoginFormState } from "@/app/login/form-state";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(
    requestMagicLinkAction,
    initialLoginFormState,
  );

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        {state.message ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              state.status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending ? "送信中..." : "Magic Link を送る"}
        </button>
      </form>

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
            or
          </span>
        </div>
      </div>

      <form action={signInWithGoogleAction}>
        <input type="hidden" name="next" value={nextPath} />
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
        >
          Google でログイン
        </button>
      </form>
    </div>
  );
}
