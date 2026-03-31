"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  initialSessionFormState,
  type SessionFormState,
} from "@/lib/session-form-state";
import { updateSessionAction } from "@/app/sessions/actions";

function fieldClass(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
    hasError
      ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 bg-white focus:border-sky-500 focus:ring-sky-100"
  }`;
}

export function SessionEditForm({
  sessionId,
  initialTitle,
  initialVisitDate,
  initialNotes,
}: {
  sessionId: string;
  initialTitle: string;
  initialVisitDate: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<SessionFormState>(initialSessionFormState);
  const [title, setTitle] = useState(initialTitle);
  const [visitDate, setVisitDate] = useState(initialVisitDate);
  const [notes, setNotes] = useState(initialNotes);

  const notesLength = notes.length;
  const isDirty =
    title !== initialTitle ||
    visitDate !== initialVisitDate ||
    notes !== initialNotes;

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
      const result = await updateSessionAction(formData);
      setState(result);

      if (result.status === "success") {
        router.push(`/sessions/${sessionId}`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <input type="hidden" name="id" value={sessionId} />
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

      <fieldset
        disabled={pending}
        className={pending ? "space-y-5 opacity-70" : "space-y-5"}
      >
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
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              clearFieldState("title");
            }}
            placeholder="例：初めての来場 / 夜のライトアップ巡り"
            className={fieldClass(Boolean(state.fieldErrors.title))}
          />
          <p className="mt-2 text-xs text-slate-500">
            この日をひとことで表す短い名前をつけます。
          </p>
          {state.fieldErrors.title ? (
            <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.title}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="session-date"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            日付
          </label>
          <input
            id="session-date"
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
            来場日を設定します。同じ日の来場日は1つまでです。
          </p>
          {state.fieldErrors.visitDate ? (
            <p className="mt-2 text-sm text-rose-600">
              {state.fieldErrors.visitDate}
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="session-notes"
              className="block text-sm font-medium text-slate-700"
            >
              メモ
            </label>
            <span className="text-xs text-slate-400">{notesLength}/1000</span>
          </div>
          <textarea
            id="session-notes"
            name="notes"
            rows={5}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              clearFieldState("notes");
            }}
            maxLength={1000}
            placeholder="その日の出来事や印象を書きます"
            className={fieldClass(Boolean(state.fieldErrors.notes))}
          />
          <p className="mt-2 text-xs text-slate-500">
            あとで振り返りたいことを書きます。
          </p>
          {state.fieldErrors.notes ? (
            <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.notes}</p>
          ) : null}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending || !isDirty}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          {pending ? "保存中..." : "更新する"}
        </button>
        <Link
          href={`/sessions/${sessionId}`}
          className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 sm:w-auto"
        >
          来場日に戻る
        </Link>
      </div>
    </form>
  );
}
