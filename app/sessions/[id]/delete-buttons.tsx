"use client";

import {
  deleteActivityLogAction,
  deleteSessionAction,
} from "@/app/sessions/actions";

export function DeleteSessionButton({ sessionId }: { sessionId: string }) {
  return (
    <form
      action={deleteSessionAction}
      onSubmit={(event) => {
        if (!window.confirm("この訪問を削除しますか？")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={sessionId} />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full border border-rose-300 px-5 py-3 text-sm font-medium text-rose-700 transition hover:border-rose-500 hover:bg-rose-50"
      >
        削除
      </button>
    </form>
  );
}

export function DeleteActivityLogButton({
  sessionId,
  logId,
}: {
  sessionId: string;
  logId: string;
}) {
  return (
    <form
      action={deleteActivityLogAction}
      onSubmit={(event) => {
        if (!window.confirm("この体験を削除しますか？")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="logId" value={logId} />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 transition hover:border-rose-400 hover:bg-rose-50"
      >
        削除
      </button>
    </form>
  );
}
