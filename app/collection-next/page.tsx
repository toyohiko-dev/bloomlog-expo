import {resolveMemoryMapEvent} from '@/lib/memory-map-navigation';
import Link from "next/link";
import {placeRegistry} from "@/lib/place-coordinate-catalog";
import {scopeMemoryRecords,scopedPavilions,isRegisteredEvent,anchorsForEvent} from "@/lib/place-registry";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { listAreas, listCollectionActivityLogs, listPavilions, listSessions, listEvents } from "@/lib/sessions";
import { getActivityPhotoUrl } from "@/lib/supabase/shared";
import { MemoryMapExplorer } from "./memory-map-explorer";

export default async function CollectionNextPage({ searchParams }: { searchParams: Promise<{ event?:string;place?:string;day?:string }> }) {
  const query=await searchParams;
  const [areas, pavilions, events, logs, sessions] = await Promise.all([listAreas(), listPavilions(), listEvents(), listCollectionActivityLogs(), listSessions()]);
  const eventId=resolveMemoryMapEvent(query.event,events);
  const geographic=eventId==='e60f2360-8147-4112-969a-00954596ceb6';
  const registry=placeRegistry;
  const scoped=scopeMemoryRecords(logs,sessions,eventId,registry);
  const scopePavilions=scopedPavilions(pavilions,eventId,registry);
  const official=isRegisteredEvent(registry,eventId);
  const explicitAnchors=geographic?anchorsForEvent(registry,eventId,"green-expo-places-v1",new Set(scopePavilions.map(p=>p.id))):official?anchorsForEvent(registry,eventId,"memory-garden-v1",new Set(scopePavilions.map(p=>p.id))):undefined;
  const scopeLabel=eventId?(events.find(event=>event.id===eventId)?.name??'イベント')+(geographic?(official?' · 場所はおおよそです':' · 選べる場所を準備しています'):''):'イベントを選んでいない記録 · 場所の並びはイメージです。';
  return <main className="min-h-screen bg-[#f8f5ec]"><div className="mx-auto max-w-4xl space-y-5 px-3 py-5 sm:px-6">
    <AppPrimaryNav currentPath="/collection-next" eventId={eventId} visitDate={query.day} />
    <header><div className="flex items-end justify-between gap-3"><div className="font-serif text-4xl font-bold tracking-tight text-[#173f34]">BloomLog<span className="ml-1 text-lg text-[#54a69a]">❧</span></div><span className="pb-1 text-xs text-[#475c4a]">思い出アルバム</span></div><h1 className="mt-2 text-base font-semibold text-[#254d3e]">わたしの会場マップ</h1></header>
    <nav aria-label="記録のイベント" className="flex flex-wrap gap-2"><Link className="rounded-full border bg-white px-4 py-2 text-sm" href="/collection-next?event=unclassified">イベントを選んでいない記録</Link>{events.map(event=><Link key={event.id} aria-current={eventId===event.id?"page":undefined} className="rounded-full border bg-white px-4 py-2 text-sm" href={`/collection-next?event=${encodeURIComponent(event.id)}`}>{event.name}</Link>)}</nav>

    <MemoryMapExplorer eventId={eventId} key={`${eventId??"legacy"}:${query.day??"all"}:${query.place??"none"}`} initialDate={query.day} initialPlaceId={query.place} mapMode={geographic?"geographic":"illustration"} explicitAnchors={explicitAnchors} scopeLabel={scopeLabel} logs={scoped.logs.map(log => ({ ...log, photoUrl: log.photo_path ? getActivityPhotoUrl(log.id) : null }))} sessions={scoped.sessions} areas={areas} pavilions={scopePavilions} />
  </div></main>;
}
