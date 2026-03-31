import Link from "next/link";
import { notFound } from "next/navigation";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { ActivityLogForm } from "@/app/sessions/[id]/activity-log-form";
import { getSession, listPavilions } from "@/lib/sessions";

type NewActivityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function NewActivityPage({ params }: NewActivityPageProps) {
  const { id } = await params;
  const [session, pavilions] = await Promise.all([getSession(id), listPavilions()]);

  if (!session) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-4">
          <AppPrimaryNav currentPath="/sessions" />
          <Link href={`/sessions/${session.id}`} className="inline-flex text-sm font-medium text-slate-500 transition hover:text-slate-900">
            この来場日に戻る
          </Link>
        </div>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-sky-700">思い出を記録する</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">思い出を記録する</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            種類を選んで入力すると、この来場日のタイムラインに思い出が追加されます。
          </p>

          <div className="mt-5 rounded-[1.5rem] bg-slate-50 px-5 py-4 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">流れ</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              1. 記録する種類を選ぶ 2. 必要な項目を入力する 3. 来場日のページに戻って思い出を確認する
            </p>
          </div>

          <div className="mt-6">
            <ActivityLogForm
              sessionId={session.id}
              pavilions={pavilions}
              successRedirectPath={`/sessions/${session.id}`}
              submitLabel="思い出を記録する"
            />
          </div>
        </section>
      </div>
    </main>
  );
}