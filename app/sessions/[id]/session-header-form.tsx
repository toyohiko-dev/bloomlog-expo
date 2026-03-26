"use client";

import { useState, useTransition } from "react";
import {
  initialSessionFormState,
  type SessionFormState,
} from "@/lib/session-form-state";
import { updateSessionAction } from "@/app/sessions/actions";

export function SessionHeaderForm({
  sessionId,
  initialTitle,
  initialMemo,
}: {
  sessionId: string;
  initialTitle: string;
  initialMemo: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SessionFormState>(initialSessionFormState);
  const [title, setTitle] = useState(initialTitle);
  const [memo, setMemo] = useState(initialMemo);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateSessionAction(formData);
      setState(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <input type="hidden" name="sessionId" value={sessionId} />

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
          htmlFor="session-title"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          タイトル
        </label>
        <input
          id="session-title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
        />
      </div>

      <div>
        <label
          htmlFor="session-memo"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          メモ
        </label>
        <textarea
          id="session-memo"
          name="memo"
          rows={4}
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
      >
        {pending ? "保存中..." : "保存"}
      </button>
    </form>
  );
}
