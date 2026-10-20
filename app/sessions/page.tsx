import Link from "next/link";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { listCollectionActivityLogs, listSessions } from "@/lib/sessions";
import { buildVisitDayReflection, buildVisitDayReflections } from "@/lib/visit-day-reflection";
import { filterVisitSessions, readVisitSessionSearch, type VisitSessionSearchParams } from "@/lib/visit-session-search";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

export default async function SessionsPage({ searchParams }: { searchParams?: Promise<VisitSessionSearchParams> }) {
  const [sessions, logs] = await Promise.all([listSessions(), listCollectionActivityLogs()]);
  const reflections = buildVisitDayReflections(logs);
  const filters = readVisitSessionSearch(await searchParams);
  const visibleSessions = filterVisitSessions(sessions, logs, filters);
  const hasFilters = Boolean(filters.query || filters.from || filters.to);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-[68rem] flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <AppPrimaryNav currentPath="/sessions" />

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              来場日一覧
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              来場日ごとに、その日の思い出をひとまとまりで見返せます。気になる日を開くと、タイムラインとメモをまとめて確認できます。
            </p>
          </div>

          {sessions.length > 0 ? (
            <form key={`${filters.query}:${filters.from}:${filters.to}`} action="/sessions" method="get" className="mt-6 space-y-3" aria-label="来場日を探す">
              <div>
                <label htmlFor="session-query" className="mb-2 block text-sm font-medium text-slate-700">キーワード検索</label>
                <input id="session-query" name="q" type="search" defaultValue={filters.query} maxLength={200}
                  placeholder="来場日のタイトル・メモ・パビリオン名・フード名など"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" />
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="session-from" className="mb-2 block text-sm font-medium text-slate-700">開始日</label>
                  <input id="session-from" name="from" type="date" defaultValue={filters.from}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" />
                </div>
                <div>
                  <label htmlFor="session-to" className="mb-2 block text-sm font-medium text-slate-700">終了日</label>
                  <input id="session-to" name="to" type="date" defaultValue={filters.to}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900" />
                </div>
                <button type="submit" className="rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white">絞り込む</button>
                {hasFilters ? <Link href="/sessions" className="px-3 py-3 text-sm font-medium text-slate-600 underline">条件を解除</Link> : null}
              </div>
              <p className="text-sm text-slate-500">{visibleSessions.length} / {sessions.length}件の来場日</p>
              {filters.error ? <p role="alert" className="text-sm text-rose-600">{filters.error}</p> : null}
            </form>
          ) : null}

          {sessions.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm leading-7 text-slate-600">
              まだ来場日はありません。ホームから最初の来場日を作りましょう。
            </div>
          ) : visibleSessions.length === 0 ? (
            <p className="mt-6 text-sm leading-7 text-slate-600">条件に合う来場日はありません。キーワードや期間を変えてお試しください。</p>
          ) : (
            <div className="mt-6 space-y-3">
              {visibleSessions.map((session) => {
                const reflection = reflections.get(session.id) ?? buildVisitDayReflection([]);
                return (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-200 px-5 py-4 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      {formatDateLabel(session.visit_date)}
                    </p>
                      <h2 className="mt-1 text-base font-semibold text-slate-900">
                        {session.title || reflection.title}
                      </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {reflection.description}
                    </p>
                    {session.memo ? (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-600">{session.memo}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-sm font-medium text-slate-700">
                    来場日を見る
                  </span>
                </Link>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
