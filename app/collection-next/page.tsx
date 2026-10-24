import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { listAreas, listCollectionActivityLogs, listPavilions, listSessions } from "@/lib/sessions";
import { getActivityPhotoUrl } from "@/lib/supabase/shared";
import { createMemoryMapDemo } from "@/lib/memory-map-demo";
import { MemoryMapExplorer } from "./memory-map-explorer";

export default async function CollectionNextPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demo = (await searchParams).demo === "1";
  const [areas, pavilions] = await Promise.all([listAreas(), listPavilions()]);
  const data = demo ? createMemoryMapDemo(pavilions) : null;
  const [logs, sessions] = data ? [data.logs, data.sessions] : await Promise.all([listCollectionActivityLogs(), listSessions()]);
  return <main className="min-h-screen bg-slate-50"><div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
    {demo ? <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">BloomLog · 保存しないデモ。架空の日付・記録です。既存データとは分離しています。</p> : <AppPrimaryNav currentPath="/collection" />}
    <header><p className="text-sm text-slate-500">思い出アルバム 検証版</p><h1 className="mt-2 text-2xl font-bold text-slate-900">地図から思い出を振り返る</h1><p className="mt-2 text-sm text-slate-600">全日程を一枚に。日付を選ぶと、その日の記録に。場所を開くと日付ごとの写真を見返せます。</p></header>
    <MemoryMapExplorer demo={demo} logs={logs.map(log => ({ ...log, photoUrl: log.photo_path ? getActivityPhotoUrl(log.photo_path) : null }))} sessions={sessions} areas={areas} pavilions={pavilions} />
  </div></main>;
}
