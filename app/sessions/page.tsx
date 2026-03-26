import Link from "next/link";
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
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            ホームへ
          </Link>
        </div>

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              訪問一覧
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600">
              訪問ごとに、その日の体験をひとまとまりで見返せます。気になる日を開くと、タイムラインとメモをまとめて確認できます。
            </p>
          </div>

          {sessions.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-sm leading-7 text-slate-600">
              まだ訪問はありません。ホームから最初の訪問を始めてみましょう。
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
                    <h2 className="mt-1 text-base font-semibold text-slate-900">
                      {session.title || "タイトル未設定"}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-600">
                      {session.memo || "まだメモはありません。"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-slate-700">
                    見る
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
