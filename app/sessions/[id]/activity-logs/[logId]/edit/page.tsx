import Link from "next/link";
import { notFound } from "next/navigation";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { ActivityLogForm } from "@/app/sessions/[id]/activity-log-form";
import type { ActivityType } from "@/lib/activity-types";
import { getActivityLog, getSession, listPavilions } from "@/lib/sessions";

type ActivityLogEditPageProps = {
  params: Promise<{
    id: string;
    logId: string;
  }>;
};

export default async function ActivityLogEditPage({ params }: ActivityLogEditPageProps) {
  const { id, logId } = await params;
  const [session, log, pavilions] = await Promise.all([
    getSession(id),
    getActivityLog(logId),
    listPavilions(),
  ]);

  if (!session || !log || String(log.session_id) !== String(session.id)) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-4">
          <AppPrimaryNav currentPath="/sessions" />
          <Link href={`/sessions/${session.id}`} className="inline-flex text-sm font-medium text-slate-500 transition hover:text-slate-900">
            この来場日に戻る
          </Link>
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-sm font-medium text-sky-700">思い出を編集する</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">思い出を編集する</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            この思い出の内容を整えて、来場日のタイムラインに反映します。
          </p>

          <ActivityLogForm
            sessionId={session.id}
            pavilions={pavilions}
            mode="edit"
            logId={log.id}
            submitLabel="保存する"
            cancelHref={`/sessions/${session.id}#experience-recorder`}
            cancelLabel="入力画面に戻る"
            initialActivityType={(log.activity_type ?? "pavilion_visit") as ActivityType}
            initialTitle={log.title ?? ""}
            initialMemo={log.memo ?? ""}
            initialOccurredAt={log.occurred_at}
            initialPrice={log.price}
            initialAcquisitionMethod={log.acquisition_method ?? "purchase"}
            initialPavilionId={log.pavilion_id ?? null}
          />
        </section>
      </div>
    </main>
  );
}