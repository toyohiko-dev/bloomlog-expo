import Link from "next/link";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { listSessions } from "@/lib/sessions";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

export default async function SessionsPage() {
  const sessions = await listSessions();

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

          {sessions.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm leading-7 text-slate-600">
              まだ来場日はありません。ホームから最初の来場日を作りましょう。
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {sessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-200 px-5 py-4 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">
                      {formatDateLabel(session.visit_date)}
                    </p>
                    {session.title ? (
                      <h2 className="mt-1 text-base font-semibold text-slate-900">
                        {session.title}
                      </h2>
                    ) : null}
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {session.memo || "まだメモはありません。"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-slate-700">
                    来場日を見る
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
