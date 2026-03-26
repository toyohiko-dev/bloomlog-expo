"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  initialSessionFormState,
  type SessionFormState,
} from "@/lib/session-form-state";
import { createSessionAction } from "@/app/sessions/actions";

function fieldClass(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
    hasError
      ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 bg-white focus:border-sky-500 focus:ring-sky-100"
  }`;
}

export function SessionCreateForm({
  initialVisitDate,
}: {
  initialVisitDate: string;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SessionFormState>(initialSessionFormState);
  const [title, setTitle] = useState(`${initialVisitDate} の訪問`);
  const [visitDate, setVisitDate] = useState(initialVisitDate);
  const [notes, setNotes] = useState("");

  function clearFieldState(field: keyof SessionFormState["fieldErrors"]) {
    setState((current) => ({
      ...current,
      status: "idle",
      message: "",
      fieldErrors: {
        ...current.fieldErrors,
        [field]: undefined,
      },
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await createSessionAction(formData);
      if (result) {
        setState(result);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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

      <fieldset
        disabled={pending}
        className={pending ? "space-y-5 opacity-70" : "space-y-5"}
      >
        <div>
          <label
            htmlFor="new-session-title"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            タイトル
          </label>
          <input
            id="new-session-title"
            name="title"
            type="text"
            required
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              clearFieldState("title");
            }}
            className={fieldClass(Boolean(state.fieldErrors.title))}
          />
          {state.fieldErrors.title ? (
            <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.title}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="new-session-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            日付
          </label>
          <input
            id="new-session-date"
            name="visitDate"
            type="date"
            required
            value={visitDate}
            onChange={(event) => {
              setVisitDate(event.target.value);
              clearFieldState("visitDate");
            }}
            className={fieldClass(Boolean(state.fieldErrors.visitDate))}
          />
          <p className="mt-2 text-xs text-slate-500">
            1日ごとにひとつの訪問として記録します。
          </p>
          {state.fieldErrors.visitDate ? (
            <p className="mt-2 text-sm text-rose-600">
              {state.fieldErrors.visitDate}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="new-session-notes"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            メモ
          </label>
          <textarea
            id="new-session-notes"
            name="notes"
            rows={5}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              clearFieldState("notes");
            }}
            placeholder="あとで見返したいことを残せます。"
            className={fieldClass(Boolean(state.fieldErrors.notes))}
          />
          <p className="mt-2 text-xs text-slate-500">
            その日の雰囲気や予定を書いておくと、あとで振り返りやすくなります。
          </p>
          {state.fieldErrors.notes ? (
            <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.notes}</p>
          ) : null}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          {pending ? "作成中..." : "訪問を作成する"}
        </button>
        <Link
          href="/sessions"
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 sm:w-auto"
        >
          訪問一覧へ
        </Link>
      </div>
    </form>
  );
}
