import Link from "next/link";
import { notFound } from "next/navigation";
import { SessionEditForm } from "@/app/sessions/[id]/edit/session-edit-form";
import { getSession } from "@/lib/sessions";

type SessionEditPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SessionEditPage({
  params,
}: SessionEditPageProps) {
  const { id } = await params;
  const session = await getSession(id);

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
          <p className="text-sm font-medium text-sky-700">来場日</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">
            来場日を編集する
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            タイトル・日付・メモを見直して、この来場日を整えられます。
          </p>

          <div className="mt-8">
            <SessionEditForm
              sessionId={session.id}
              initialTitle={session.title ?? ""}
              initialVisitDate={session.visit_date}
              initialNotes={session.memo ?? ""}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
