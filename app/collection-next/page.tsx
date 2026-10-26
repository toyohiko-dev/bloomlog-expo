import {resolveMemoryMapEvent} from '@/lib/memory-map-navigation';
import {createGeographicMemoryDemo} from '@/lib/green-expo-demo';
import {greenExpoMapAnchors} from '@/lib/green-expo-map';
import reviewedPlaces from '@/lib/green-expo-reviewed-bindings.json';
import Link from "next/link";
import {placeRegistry} from "@/lib/place-coordinate-catalog";
import {scopeMemoryRecords,scopedPavilions,isRegisteredEvent,anchorsForEvent} from "@/lib/place-registry";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { listAreas, listCollectionActivityLogs, listPavilions, listSessions, listEvents } from "@/lib/sessions";
import { getActivityPhotoUrl } from "@/lib/supabase/shared";
import { createMemoryMapDemo } from "@/lib/memory-map-demo";
import { MemoryMapExplorer } from "./memory-map-explorer";

export default async function CollectionNextPage({ searchParams }: { searchParams: Promise<{ demo?: string; event?:string;place?:string;day?:string }> }) {
  const query=await searchParams;
  const geographicDemo=query.demo==='geo';
  const demo = query.demo === "1"||geographicDemo;
  const [areas, loadedPavilions, events] = await Promise.all([listAreas(), listPavilions(), listEvents()]);
  const geographicData=geographicDemo?createGeographicMemoryDemo():null;
  const pavilions=geographicData?.pavilions??loadedPavilions;
  const data = geographicData??(demo ? createMemoryMapDemo(pavilions) : null);
  const [logs, sessions] = data ? [data.logs, data.sessions] : await Promise.all([listCollectionActivityLogs(), listSessions()]);
  const eventId=geographicDemo?'e60f2360-8147-4112-969a-00954596ceb6':!demo?resolveMemoryMapEvent(query.event,events):null;
  const geographic=eventId==='e60f2360-8147-4112-969a-00954596ceb6';
  const registry=geographicDemo?{events:[{id:eventId!,name:'GREEN×EXPO2027',sourceNamespace:'public-place-demo'}],places:reviewedPlaces,anchors:greenExpoMapAnchors}:placeRegistry;
  const scoped=scopeMemoryRecords(logs,sessions,eventId,registry);
  const scopePavilions=scopedPavilions(pavilions,eventId,registry);
  const official=isRegisteredEvent(registry,eventId);
  const explicitAnchors=geographic?anchorsForEvent(registry,eventId,"green-expo-places-v1",new Set(scopePavilions.map(p=>p.id))):official?anchorsForEvent(registry,eventId,"memory-garden-v1",new Set(scopePavilions.map(p=>p.id))):undefined;
  const scopeLabel=geographicDemo?'GREEN×EXPO 2027 · 公開図からの推定配置':eventId?(events.find(event=>event.id===eventId)?.name??'イベント')+(geographic?(official?' · 推定配置・現地未検証':' · 新しい記録先は公開準備中'):' · 施設台帳未対応'):'未分類の記録 · 配置はイメージです。';
  return <main className="min-h-screen bg-[#f8f5ec]"><div className="mx-auto max-w-4xl space-y-5 px-3 py-5 sm:px-6">
    {demo ? <p role="status" className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">保存しないプレビュー · 記録と写真は架空のイラストです。</p> : <AppPrimaryNav currentPath="/collection-next" eventId={eventId} visitDate={query.day} />}
    <header><div className="flex items-end justify-between gap-3"><div className="font-serif text-4xl font-bold tracking-tight text-[#173f34]">BloomLog<span className="ml-1 text-lg text-[#54a69a]">❧</span></div><span className="pb-1 text-xs text-[#475c4a]">思い出アルバム</span></div><h1 className="mt-2 text-base font-semibold text-[#254d3e]">わたしの会場マップ</h1></header>
    {!demo?<nav aria-label="記録のイベント" className="flex flex-wrap gap-2"><Link className="rounded-full border bg-white px-4 py-2 text-sm" href="/collection-next?event=unclassified">未分類の記録</Link>{events.map(event=><Link key={event.id} aria-current={eventId===event.id?"page":undefined} className="rounded-full border bg-white px-4 py-2 text-sm" href={`/collection-next?event=${encodeURIComponent(event.id)}`}>{event.name}</Link>)}</nav>:null}

    <MemoryMapExplorer eventId={eventId} key={`${eventId??"legacy"}:${query.day??"all"}:${query.place??"none"}`} initialDate={query.day} initialPlaceId={query.place} mapMode={geographic?"geographic":"illustration"} explicitAnchors={explicitAnchors} scopeLabel={scopeLabel} demo={demo} logs={scoped.logs.map(log => ({ ...log, photoUrl: geographicDemo?log.photo_path:demo && log.activity_type === "pavilion_visit" ? "/art/memory-garden-v1.png" : log.photo_path ? getActivityPhotoUrl(log.id) : null }))} sessions={scoped.sessions} areas={areas} pavilions={scopePavilions} />
  </div></main>;
}
