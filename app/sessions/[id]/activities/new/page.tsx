import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityLogForm } from "@/app/sessions/[id]/activity-log-form";
import { getSession, listPavilions } from "@/lib/sessions";

type NewActivityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewActivityPage({
  params,
}: NewActivityPageProps) {
  const { id } = await params;
  const [session, pavilions] = await Promise.all([getSession(id), listPavilions()]);

  if (!session) {
    notFound();
  }

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
          <Link
            href={`/sessions/${session.id}`}
            className="text-slate-500 transition hover:text-slate-900"
          >
            訪問へ戻る
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-sky-700">New Experience</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            体験を追加
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            この訪問での出来事を体験として記録します。記録するとタイムラインに追加されます。
          </p>

          <ActivityLogForm
            sessionId={session.id}
            pavilions={pavilions}
            successRedirectPath={`/sessions/${session.id}`}
            submitLabel="記録する"
          />
        </section>
      </div>
    </main>
  );
}
