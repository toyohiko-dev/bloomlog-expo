import Link from "next/link";
import { startSessionForDateAction } from "@/app/sessions/actions";
import {
  getPavilionProgressSummary,
  listCollectionActivityLogs,
  listSessions,
  todayDateString,
} from "@/lib/sessions";

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(`${value}T00:00:00+09:00`));
}

export default async function HomePage() {
  const [sessions, experiences, pavilionProgress] = await Promise.all([
    listSessions(),
    listCollectionActivityLogs(),
    getPavilionProgressSummary(),
  ]);

  const recentSessions = sessions.slice(0, 3);
  const initialVisitDate = todayDateString();

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-8 px-6 py-8 lg:grid-cols-[1.4fr_0.9fr] lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-emerald-700">
                  BloomLog Expo
                </p>
                <h1 className="max-w-2xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  今日の体験を、あとから何度も楽しめる記録に。
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  行った場所、食べたもの、手に入れたものを来場日ごとに残せます。
                  タイムラインやコレクションを見返せば、その日の楽しさがまたよみがえります。
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/80 px-5 py-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-medium tracking-wide text-slate-500">
                    これまでの来場日
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {sessions.length}
                  </p>
                </div>
                <div className="rounded-3xl bg-white/80 px-5 py-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-medium tracking-wide text-slate-500">
                    記録した体験
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {experiences.length}
                  </p>
                </div>
                <div className="rounded-3xl bg-white/80 px-5 py-4 shadow-sm ring-1 ring-slate-200">
                  <p className="text-xs font-medium tracking-wide text-slate-500">
                    訪れたパビリオン
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {pavilionProgress.totalPavilions > 0
                      ? `${pavilionProgress.visitedPavilions} / ${pavilionProgress.totalPavilions}`
                      : pavilionProgress.visitedPavilions}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
              <div className="space-y-5">
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold text-slate-900">
                    来場日を作る
                  </h2>
                  <p className="text-sm leading-6 text-slate-600">
                    来場日を残したい日を選ぶと、その日の記録を始められます。
                  </p>
                </div>

                <form action={startSessionForDateAction} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="visit-date"
                      className="text-sm font-medium text-slate-700"
                    >
                      来場日
                    </label>
                    <input
                      id="visit-date"
                      name="visitDate"
                      type="date"
                      defaultValue={initialVisitDate}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    来場日を作る
                  </button>
                </form>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Link
                    href="/sessions"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                  >
                    来場日一覧を見る
                  </Link>
                  <Link
                    href="/collection"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
                  >
                    コレクションを見る
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  最近の来場日
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  直近の来場日を開いて、タイムラインをすぐ見返せます。
                </p>
              </div>
              <Link
                href="/sessions"
                className="text-sm font-medium text-slate-700 transition hover:text-slate-900"
              >
                来場日一覧を見る
              </Link>
            </div>

            {recentSessions.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm leading-7 text-slate-600">
                まだ来場日はありません。最初の来場日を作ると、ここから見返せるようになります。
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {recentSessions.map((session) => (
                  <Link
                    key={session.id}
                    href={`/sessions/${session.id}`}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 px-5 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500">
                        {formatDateLabel(session.visit_date)}
                      </p>
                      <h3 className="mt-1 truncate text-base font-semibold text-slate-900">
                        {session.title || "タイトル未設定"}
                      </h3>
                      <p className="mt-1 truncate text-sm text-slate-600">
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
          </div>

          <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">残せるもの</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              その日の出来事を体験として重ねていくと、あとから見返す楽しみが増えていきます。
            </p>
            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="rounded-2xl bg-slate-50 px-4 py-3">
                パビリオンでの体験
              </li>
              <li className="rounded-2xl bg-slate-50 px-4 py-3">
                食べたものや買ったもの
              </li>
              <li className="rounded-2xl bg-slate-50 px-4 py-3">
                手に入れたピンバッジ
              </li>
              <li className="rounded-2xl bg-slate-50 px-4 py-3">
                あとで見返したいメモ
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
