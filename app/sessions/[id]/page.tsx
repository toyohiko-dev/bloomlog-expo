import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteActivityLogButton, DeleteSessionButton } from "./delete-buttons";
import { ActivityLogForm } from "./activity-log-form";
import { getAcquisitionMethodLabel, getActivityTypeMeta } from "@/lib/activity-types";
import {
  getActivityLog,
  getActivityLogTitle,
  getSession,
  listActivityLogs,
  listPavilions,
} from "@/lib/sessions";

function formatVisitDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

function formatTime(value: string | null) {
  if (!value) {
    return "時刻なし";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<{ editLog?: string }>
    | { editLog?: string | string[] | undefined };
};

export default async function SessionDetailPage({
  params,
  searchParams,
}: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionId = resolvedParams.id;
  const editLogId = Array.isArray(resolvedSearchParams?.editLog)
    ? resolvedSearchParams?.editLog[0]
    : resolvedSearchParams?.editLog;

  const [session, logs, pavilions, editingLog] = await Promise.all([
    getSession(sessionId),
    listActivityLogs(sessionId),
    listPavilions(),
    editLogId ? getActivityLog(editLogId) : Promise.resolve(null),
  ]);

  if (!session) {
    notFound();
  }

  const validEditingLog =
    editingLog && String(editingLog.session_id) === String(sessionId)
      ? editingLog
      : null;

  const summary = {
    pavilion: logs.filter((log) => log.activity_type === "pavilion_visit").length,
    food: logs.filter((log) => log.activity_type === "food").length,
    pin: logs.filter((log) => log.activity_type === "pin").length,
    event: logs.filter((log) => log.activity_type === "event_participation").length,
  };

  const editorHeading = validEditingLog ? "体験を編集" : "体験を追加";
  const editorTitle = validEditingLog ? "体験を整える" : "体験を記録する";
  const editorHelper = validEditingLog
    ? "内容を直すと、タイムラインにもすぐ反映されます。"
    : "その日の出来事をひとつずつ残していくと、あとで流れを見返しやすくなります。";
  const resetEditorHref = `/sessions/${sessionId}#experience-editor`;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            ホームへ
          </Link>
          <Link
            href="/sessions"
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            訪問一覧へ
          </Link>
        </div>

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-500">
                {formatVisitDate(session.visit_date)}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                {session.title || "タイトル未設定"}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                {session.memo ||
                  "この訪問には、まだメモがありません。思い出しておきたいことがあれば、あとから追加できます。"}
              </p>
            </div>

            <div className="flex flex-wrap items-start gap-3">
              <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                タイトルやメモを整えておけます。
              </div>
              <Link
                href={`/sessions/${sessionId}/edit`}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
              >
                編集
              </Link>
              <DeleteSessionButton sessionId={sessionId} />
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl bg-sky-50 px-5 py-4 ring-1 ring-sky-100">
              <p className="text-xs font-medium tracking-wide text-sky-700">
                パビリオン
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {summary.pavilion}
              </p>
            </div>
            <div className="rounded-3xl bg-amber-50 px-5 py-4 ring-1 ring-amber-100">
              <p className="text-xs font-medium tracking-wide text-amber-700">
                フード
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {summary.food}
              </p>
            </div>
            <div className="rounded-3xl bg-fuchsia-50 px-5 py-4 ring-1 ring-fuchsia-100">
              <p className="text-xs font-medium tracking-wide text-fuchsia-700">
                ピンバッジ
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {summary.pin}
              </p>
            </div>
            <div className="rounded-3xl bg-emerald-50 px-5 py-4 ring-1 ring-emerald-100">
              <p className="text-xs font-medium tracking-wide text-emerald-700">
                イベント
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {summary.event}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_24rem]">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-[1.75rem] bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  タイムライン
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  その日の流れを、体験ごとにたどれます。
                </p>
              </div>
              <Link
                href={`/sessions/${sessionId}/activities/new`}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 lg:hidden"
              >
                ＋ 体験を追加
              </Link>
            </div>

            {logs.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-10 text-center shadow-sm">
                <p className="text-base font-medium text-slate-900">
                  まだ体験はありません。
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  最初のひとつを記録すると、この日の流れがここに並びます。
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log) => {
                  const meta = getActivityTypeMeta(log.activity_type);
                  const isEditing = validEditingLog?.id === log.id;

                  return (
                    <article
                      key={log.id}
                      className={`rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 transition ${
                        isEditing ? "ring-sky-300" : "ring-slate-200"
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                        <div className="w-24 shrink-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {formatTime(log.occurred_at)}
                          </p>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.badgeClassName}`}
                              >
                                {meta.label}
                              </span>
                              <h3 className="mt-3 text-lg font-semibold text-slate-900">
                                {getActivityLogTitle(log) || "名前未設定"}
                              </h3>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Link
                                href={`/sessions/${sessionId}?editLog=${log.id}#experience-editor`}
                                className="hidden rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 lg:inline-flex"
                              >
                                編集
                              </Link>
                              <Link
                                href={`/sessions/${sessionId}/activity-logs/${log.id}/edit`}
                                className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 lg:hidden"
                              >
                                編集
                              </Link>
                              <DeleteActivityLogButton
                                sessionId={sessionId}
                                logId={log.id}
                              />
                            </div>
                          </div>

                          <div className="mt-4 space-y-2">
                            {log.price !== null ? (
                              <p className="text-sm text-slate-600">
                                <span className="font-medium text-slate-500">
                                  価格
                                </span>{" "}
                                ¥{log.price}
                              </p>
                            ) : null}
                            {log.acquisition_method ? (
                              <p className="text-sm text-slate-600">
                                <span className="font-medium text-slate-500">
                                  入手方法
                                </span>{" "}
                                {getAcquisitionMethodLabel(log.acquisition_method) ??
                                  "未設定"}
                              </p>
                            ) : null}
                            <p className="text-sm leading-7 text-slate-600">
                              {log.memo ||
                                "この体験には、まだメモがありません。"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside
            id="experience-editor"
            className="hidden h-fit rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 lg:block"
          >
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">{editorHeading}</p>
              <h2 className="text-xl font-semibold text-slate-900">
                {editorTitle}
              </h2>
              <p className="text-sm leading-6 text-slate-600">{editorHelper}</p>
              {validEditingLog ? (
                <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
                  編集中: {getActivityLogTitle(validEditingLog) || "名前未設定"}
                </div>
              ) : null}
            </div>

            <ActivityLogForm
              key={validEditingLog ? `edit:${validEditingLog.id}` : "create"}
              sessionId={sessionId}
              pavilions={pavilions}
              mode={validEditingLog ? "edit" : "create"}
              logId={validEditingLog?.id}
              initialActivityType={
                (validEditingLog?.activity_type as
                  | "pavilion_visit"
                  | "food"
                  | "pin"
                  | "event_participation"
                  | undefined) ?? "pavilion_visit"
              }
              initialTitle={validEditingLog?.title ?? ""}
              initialMemo={validEditingLog?.memo ?? ""}
              initialOccurredAt={validEditingLog?.occurred_at ?? null}
              initialPrice={validEditingLog?.price ?? null}
              initialAcquisitionMethod={
                validEditingLog?.acquisition_method ?? null
              }
              initialPavilionId={validEditingLog?.pavilion_id ?? null}
              successRedirectPath={resetEditorHref}
              submitLabel={validEditingLog ? "更新する" : "記録する"}
              cancelHref={validEditingLog ? resetEditorHref : undefined}
              cancelLabel={validEditingLog ? "追加に戻る" : undefined}
            />
          </aside>
        </section>
      </div>
    </main>
  );
}
