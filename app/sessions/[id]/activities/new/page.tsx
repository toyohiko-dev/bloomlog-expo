import {memoryMapHref} from "@/lib/memory-map-navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { ActivityLogForm } from "@/app/sessions/[id]/activity-log-form";
import { getSession, listPavilions, listSessions, listActivityLogs } from "@/lib/sessions";

type NewActivityPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{place?:string;return?:string;mapDay?:string}>;
};

export default async function NewActivityPage({ params, searchParams }: NewActivityPageProps) {
  const { id } = await params;
  const [session, pavilions, visitSessions, query, recentLogs] = await Promise.all([getSession(id), listPavilions(), listSessions(), searchParams, listActivityLogs(id)]);
  const selectedPlace=pavilions.find(place=>place.id===query.place);

  if (!session) {
    notFound();
  }

  const photoEntry=query.return==='map';
  const returnMapDate=query.mapDay==='all'?null:session.visit_date;
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="space-y-4">
          <AppPrimaryNav currentPath="/sessions" eventId={session.event_id} visitDate={session.visit_date} />
          <Link href={photoEntry?memoryMapHref(session.event_id,returnMapDate):`/sessions/${session.id}`} className="inline-flex text-sm font-medium text-slate-500 transition hover:text-slate-900">
            {photoEntry?"地図に戻る":"この来場日に戻る"}
          </Link>
        </div>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {!photoEntry?<p className="text-sm font-medium text-sky-700">思い出を記録する</p>:null}
          <h1 className="mt-2 text-3xl font-semibold text-slate-900">{photoEntry?"写真を記録する":"思い出を記録する"}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {photoEntry?"写真と来場日を確認して保存。場所やメモはあとで整えられます。":"種類を選んで入力すると、この来場日のタイムラインに思い出が追加されます。"}
          </p>

          {!photoEntry?<div className="mt-5 rounded-[1.5rem] bg-slate-50 px-5 py-4 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">流れ</p>
            <p className="mt-2 text-sm leading-7 text-slate-700">
              1. 記録する種類を選ぶ 2. 必要な項目を入力する 3. 来場日のページに戻って思い出を確認する
            </p>
          </div>:null}

          <div className="mt-6">
            <ActivityLogForm
              key={`${session.user_id}:${session.id}`}
              sessionId={session.id}
              visitDate={session.visit_date}
              visitEventId={session.event_id}
              visitSessions={visitSessions.map(day=>({id:day.id,visit_date:day.visit_date,event_id:day.event_id}))}
              recentPavilionIds={recentLogs.map(log=>log.pavilion_id).filter((id):id is string=>Boolean(id))}
              initialPavilionId={selectedPlace?.id}
              initialActivityType={photoEntry&&!selectedPlace?"event_participation":"pavilion_visit"}
              initialTitle={selectedPlace?.name??(photoEntry?"写真の思い出":undefined)}
              draftOwnerId={session.user_id}
              pavilions={pavilions}
              returnToMap={photoEntry}
              returnMapDate={returnMapDate}
              successRedirectPath={`/sessions/${session.id}`}
              submitLabel="思い出を記録する"
            />
          </div>
        </section>
      </div>
    </main>
  );
}
