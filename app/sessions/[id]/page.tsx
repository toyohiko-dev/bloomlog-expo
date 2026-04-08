import Link from "next/link";
import { notFound } from "next/navigation";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { DeleteActivityLogButton, DeleteSessionButton } from "./delete-buttons";
import { ActivityLogForm } from "./activity-log-form";
import {
  getAcquisitionMethodLabel,
  getActivityTypeMeta,
  neutralSummaryTone,
} from "@/lib/activity-types";
import {
  getActivityLog,
  getActivityLogTitle,
  getSession,
  listActivityLogs,
  listPavilions,
} from "@/lib/sessions";
import { getActivityPhotoUrl, getPavilionImageUrl } from "@/lib/supabase/shared";

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

function ActivityTypeIcon({ activityType }: { activityType: string | null }) {
  const className = "h-5 w-5";

  switch (activityType) {
    case "pavilion_visit":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M4 20h16M6 20V9l6-4 6 4v11M9 20v-5h6v5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "food":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M7 4v7M10 4v7M7 8h3M17 4c1.5 2 1.5 5 0 7v9M8.5 11v9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "pin":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M12 20v-5M9 4l6 6-2 2 3 3-1 1-3-3-2 2-6-6 5-5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "event_participation":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <path
            d="M5 8h14M8 4v4M16 4v4M6 20h12a1 1 0 0 0 1-1V8H5v11a1 1 0 0 0 1 1ZM9 12h2v2H9v-2Zm4 0h2v2h-2v-2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className}>
          <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
  }
}

function getActivityTypeVisual(activityType: string | null) {
  const meta = getActivityTypeMeta(activityType);

  return {
    iconClassName: meta.iconClassName,
    accentClassName: meta.accentClassName,
  };
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
  const timelineLogs = logs.map((log) => ({
    ...log,
    thumbnailUrl: log.photo_path ? getActivityPhotoUrl(log.photo_path) : null,
    pavilionThumbnailUrl: log.pavilion?.image_path
      ? getPavilionImageUrl(log.pavilion.image_path)
      : null,
  }));
  const resetEditorHref = `/sessions/${sessionId}#experience-recorder`;
  const pavilionTone = getActivityTypeMeta("pavilion_visit");
  const foodTone = getActivityTypeMeta("food");
  const pinTone = getActivityTypeMeta("pin");
  const eventTone = getActivityTypeMeta("event_participation");

  const summaryItems = [
    {
      key: "total",
      label: "思い出",
      value: timelineLogs.length,
      cardClassName: neutralSummaryTone.cardClassName,
      labelClassName: neutralSummaryTone.labelClassName,
    },
    {
      key: "pavilion",
      label: "パビリオン",
      value: timelineLogs.filter((log) => log.activity_type === "pavilion_visit").length,
      cardClassName: pavilionTone.summaryCardClassName,
      labelClassName: pavilionTone.summaryLabelClassName,
    },
    {
      key: "food",
      label: "フード",
      value: timelineLogs.filter((log) => log.activity_type === "food").length,
      cardClassName: foodTone.summaryCardClassName,
      labelClassName: foodTone.summaryLabelClassName,
    },
    {
      key: "pin",
      label: "ピンバッジ",
      value: timelineLogs.filter((log) => log.activity_type === "pin").length,
      cardClassName: pinTone.summaryCardClassName,
      labelClassName: pinTone.summaryLabelClassName,
    },
    {
      key: "event",
      label: "イベント",
      value: timelineLogs.filter(
        (log) => log.activity_type === "event_participation",
      ).length,
      cardClassName: eventTone.summaryCardClassName,
      labelClassName: eventTone.summaryLabelClassName,
    },
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[68rem] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AppPrimaryNav currentPath="/sessions" />

        <section className="w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-sm ring-1 ring-slate-200">
          <div className="px-6 py-8 sm:px-6 lg:px-10 lg:py-10">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-emerald-700">
                  {formatVisitDate(session.visit_date)}
                </p>
                <div className="space-y-2">
                  {session.title ? (
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                      {session.title}
                    </h1>
                  ) : null}
                  {session.memo ? (
                    <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                      {session.memo}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/sessions/${sessionId}/edit`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                >
                  来場日を編集する
                </Link>
                <DeleteSessionButton sessionId={sessionId} />
              </div>
            </div>
          </div>
        </section>

        <section
          id="experience-recorder"
          className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7"
        >
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {validEditingLog ? "思い出を編集中" : "思い出を記録する"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {validEditingLog ? "思い出を編集する" : "思い出を記録する"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                種類を選ぶと、そのまま必要な入力だけが表示されます。
              </p>
            </div>

            {validEditingLog ? (
              <div className="rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700 ring-1 ring-sky-100">
                編集中の思い出:{" "}
                {getActivityLogTitle(validEditingLog) || "タイトル未設定"}
              </div>
            ) : null}
          </div>

          <div className="mt-6">
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
              submitLabel={validEditingLog ? "保存する" : "記録する"}
              cancelHref={validEditingLog ? resetEditorHref : undefined}
              cancelLabel={validEditingLog ? "新しい思い出に戻る" : undefined}
            />
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-7">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">この日のサマリー</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                この来場日の思い出
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              入力した内容が、あとから見返しやすい形でまとまります。
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
            {summaryItems.map((item) => (
              <div
                key={item.key}
                className={`rounded-3xl px-4 py-4 ring-1 ${item.cardClassName}`}
              >
                <p className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  {item.value}
                </p>
                <p
                  className={`mt-1 text-xs font-medium tracking-wide ${item.labelClassName}`}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">タイムライン</p>
              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                今日の流れ
              </h2>
            </div>
            <p className="text-sm text-slate-500">
              入力した思い出が時系列で並びます。
            </p>
          </div>

          {timelineLogs.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-sm leading-7 text-slate-600">
              まだ思い出はありません。上の入力エリアから、その日の思い出を記録できます。
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {timelineLogs.map((log) => {
                const meta = getActivityTypeMeta(log.activity_type);
                const isEditing = validEditingLog?.id === log.id;
                const visual = getActivityTypeVisual(log.activity_type);
                const thumbnailUrl =
                  log.thumbnailUrl ??
                  (log.activity_type === "pavilion_visit"
                    ? log.pavilionThumbnailUrl
                    : null);

                return (
                  <article
                    key={log.id}
                    className={`rounded-[1.5rem] bg-white p-4 ring-1 transition sm:p-5 ${
                      isEditing ? "ring-sky-200 bg-sky-50/40" : "ring-slate-200"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex shrink-0 items-center gap-3 sm:w-28 sm:flex-col sm:items-start sm:gap-4">
                        <span
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${visual.iconClassName}`}
                        >
                          <ActivityTypeIcon activityType={log.activity_type} />
                        </span>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatTime(log.occurred_at)}
                        </p>
                      </div>

                      <div
                        className={`min-w-0 flex-1 border-l pl-4 ${visual.accentClassName}`}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${meta.badgeClassName}`}
                            >
                              {meta.label}
                            </span>
                            <h3 className="mt-3 text-lg font-semibold text-slate-900">
                              {getActivityLogTitle(log) || "タイトル未設定"}
                            </h3>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/sessions/${sessionId}?editLog=${log.id}#experience-recorder`}
                              className="inline-flex rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                            >
                              編集する
                            </Link>
                            <DeleteActivityLogButton
                              sessionId={sessionId}
                              logId={log.id}
                            />
                          </div>
                        </div>

                        <div className="mt-3 space-y-2 sm:mt-4">
                          {thumbnailUrl ? (
                            <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 sm:max-w-xl">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={thumbnailUrl}
                                alt={getActivityLogTitle(log) || meta.label}
                                className="mx-auto h-auto max-h-72 w-full object-contain bg-slate-50 sm:max-h-80"
                              />
                            </div>
                          ) : null}
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
                            {log.memo || "この思い出にはまだメモがありません。"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
