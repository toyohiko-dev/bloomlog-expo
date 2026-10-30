import Link from "next/link";
import { SessionCreateForm } from "@/app/sessions/new/session-create-form";
import { getSessionByVisitDate, todayDateString, listEvents } from "@/lib/sessions";

type NewSessionPageProps = {
  searchParams?: Promise<{ event?:string;visitDate?: string | string[] | undefined }>;
};

export default async function NewSessionPage({
  searchParams,
}: NewSessionPageProps) {
  const today = todayDateString();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const requestedVisitDate = Array.isArray(resolvedSearchParams?.visitDate)
    ? resolvedSearchParams?.visitDate[0]
    : resolvedSearchParams?.visitDate;
  const visitDate = requestedVisitDate || today;
  const [existingSession,events] = await Promise.all([getSessionByVisitDate(visitDate),listEvents()]);
  const initialEventId=events.find(event=>event.id===resolvedSearchParams?.event)?.id??"";

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
            来場日一覧へ
          </Link>
          <Link
            href="/collection"
            className="text-slate-500 transition hover:text-slate-900"
          >
            思い出アルバム
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-sky-700">来場日を追加する</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            来場日を追加する
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            行った日を選びましょう。タイトルとメモは、あとからでも書けます。
          </p>

          {existingSession ? (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">
                {visitDate === today
                  ? "今日の来場日は、すでにあります。"
                  : "この日の来場日は、すでにあります。"}
              </p>
              <p className="mt-2 leading-6">
                その日のページを開くと、続きを記録できます。
              </p>
              <div className="mt-4">
                <Link
                  href={`/sessions/${existingSession.id}`}
                  className="inline-flex items-center justify-center rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
                >
                  来場日を開く
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-8">
            <SessionCreateForm initialVisitDate={visitDate} events={events} initialEventId={initialEventId} />
          </div>
        </section>
      </div>
    </main>
  );
}
