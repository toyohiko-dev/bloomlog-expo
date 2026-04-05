"use client";

import { useActionState, useEffect, useState } from "react";
import {
  saveProfileAction,
  saveProfileSetupAction,
} from "@/app/profile/actions";
import {
  initialProfileFormState,
  type ProfileFormState,
} from "@/lib/profile-shared";

type ProfileFormProps = {
  initialDisplayName: string;
  submitLabel: string;
  description?: string;
  nextPath?: string;
  mode?: "edit" | "setup";
};

function fieldClass(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
    hasError
      ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 bg-white focus:border-emerald-500 focus:ring-emerald-100"
  }`;
}

export function ProfileForm({
  initialDisplayName,
  submitLabel,
  description,
  nextPath = "/",
  mode = "edit",
}: ProfileFormProps) {
  const action = mode === "setup" ? saveProfileSetupAction : saveProfileAction;
  const [state, formAction, pending] = useActionState<ProfileFormState, FormData>(
    action,
    {
      ...initialProfileFormState,
      displayName: initialDisplayName,
    },
  );
  const [displayNameValue, setDisplayNameValue] = useState(initialDisplayName);

  useEffect(() => {
    setDisplayNameValue(initialDisplayName);
  }, [initialDisplayName]);

  useEffect(() => {
    if (state.status === "success" || state.status === "error") {
      setDisplayNameValue(state.displayName);
    }
  }, [state.displayName, state.status]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      {description ? (
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      ) : null}

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

      <div>
        <label
          htmlFor="displayName"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          ニックネーム
        </label>
        <input
          id="displayName"
          name="displayName"
          type="text"
          required
          maxLength={20}
          value={displayNameValue}
          onChange={(event) => setDisplayNameValue(event.target.value)}
          placeholder="例: はなみ / taro"
          className={fieldClass(Boolean(state.fieldErrors.displayName))}
        />
        <p className="mt-2 text-xs text-slate-500">
          BloomLog 内で表示される名前です。20文字以内で設定してください。
        </p>
        {state.fieldErrors.displayName ? (
          <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.displayName}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {pending ? "保存中..." : submitLabel}
      </button>
    </form>
  );
}
