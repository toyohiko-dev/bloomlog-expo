import Link from "next/link";
import { SessionCreateForm } from "@/app/sessions/new/session-create-form";
import { getSessionByVisitDate, todayDateString } from "@/lib/sessions";

export default async function NewSessionPage() {
  const today = todayDateString();
  const todaySession = await getSessionByVisitDate(today);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6 flex flex-wrap items-center gap-4 text-sm font-medium">
          <Link href="/" className="text-slate-500 transition hover:text-slate-900">
            ホームへ
          </Link>
          <Link
            href="/sessions"
            className="text-sky-700 transition hover:text-sky-900"
          >
            訪問一覧へ
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-sky-700">New Visit</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            訪問を作成
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            記録したい日をひとつの訪問として作成します。あとから体験を追加して、その日の流れを残せます。
          </p>

          {todaySession ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">今日の訪問は、すでにあります。</p>
              <p className="mt-2 leading-6">
                続きから記録する場合は、既存の訪問を開いてください。
              </p>
              <div className="mt-4">
                <Link
                  href={`/sessions/${todaySession.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
                >
                  今日の訪問を見る
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <SessionCreateForm initialVisitDate={today} />
          </div>
        </section>
      </div>
    </main>
  );
}
