"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ActivityLog, Area, PavilionOption, VisitSession } from "@/lib/session-shared";
import { buildMemoryMap, type MemoryEntry } from "@/lib/memory-map";
import type { PavilionCollectionItem } from "@/lib/sessions";
import { BloomingVenueMap } from "./blooming-venue-map";

type PhotoEntry = ActivityLog & { photoUrl: string | null };
type Props = { demo?: boolean; logs: PhotoEntry[]; sessions: VisitSession[]; areas: Area[]; pavilions: PavilionOption[] };
const labels: Record<string, string> = { pavilion_visit: "パビリオン", food: "フード", pin: "ピンバッジ", event_participation: "イベント" };

export function MemoryMapExplorer({ logs, sessions, areas, pavilions, demo = false }: Props) {
  const [date, setDate] = useState<string | null>(null);
  const model = buildMemoryMap(logs, sessions, date);
  const photoById = new Map(logs.map(log => [log.id, log]));
  const items: PavilionCollectionItem[] = model.places.filter(place => place.visited).map(place => {
    const pavilion = pavilions.find(item => item.id === place.id);
    const visits = place.entries.filter(entry => entry.activity_type === "pavilion_visit");
    return { key: place.id, pavilionId: place.id, title: pavilion?.name ?? "場所未登録", areaId: pavilion?.area_id ?? null,
      count: place.visitCount, firstVisitedAt: visits[0]?.occurred_at ?? visits[0]?.created_at ?? null,
      latestVisitedAt: visits.at(-1)?.occurred_at ?? visits.at(-1)?.created_at ?? null,
      latestSessionId: visits.at(-1)?.session_id ?? "", countryId: pavilion?.country_id ?? null, imagePath: pavilion?.image_path ?? null };
  });
  function entriesView(entries: MemoryEntry[]) {
    return <ul className="space-y-3">{entries.map(entry => {
      const photo = photoById.get(entry.id);
      return <li key={entry.id} className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs text-slate-500">{labels[entry.activity_type ?? ""] ?? "思い出"}</span>
          {demo ? <span className="text-xs text-slate-500">サンプル・保存なし</span> : <Link className="text-xs underline" href={`/sessions/${entry.session_id}?editLog=${entry.id}#experience-recorder`}>記録を見る</Link>}</div>
        <p className="font-semibold text-slate-900">{entry.title || "名前なし"}</p>
        {photo?.photoUrl ? <Image unoptimized width={600} height={400} src={photo.photoUrl} alt={entry.title || "思い出の写真"} className="mt-2 max-h-52 w-full rounded-lg object-contain" /> : <p className="mt-1 text-xs text-slate-500">写真なし</p>}
      </li>;
    })}</ul>;
  }
  return <div className="space-y-5">
    <nav aria-label="地図の日付" className="flex flex-wrap items-center gap-2">
      <button type="button" aria-pressed={date === null} onClick={() => setDate(null)} className={`rounded-full border px-4 py-2 text-sm ${date === null ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}>全日程</button>
      <label className="text-sm text-slate-700">1日を選ぶ <select aria-label="地図に表示する来場日" value={date ?? ""} onChange={event => setDate(event.target.value || null)} className="ml-2 rounded-lg border bg-white px-3 py-2"><option value="">全日程</option>{model.dates.map(day => <option key={day} value={day}>{day}</option>)}</select></label>
      <p role="status" className="text-sm text-slate-500">{date ?? "全日程"} · {model.entries.length}件の思い出 · {items.length}か所訪問</p>
    </nav>
    <BloomingVenueMap areas={areas} pavilions={pavilions} visitedItems={items} renderPlaceDetail={(id, onClose) => {
      const place = model.places.find(item => item.id === id);
      return <aside aria-label="場所の思い出" className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 max-h-[75%] overflow-y-auto border-t bg-white p-5 shadow-xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-96 sm:rounded-2xl sm:border" onPointerDown={event => event.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-bold">{pavilions.find(item => item.id === id)?.name ?? "場所未登録"}</h3><button type="button" aria-label="場所の思い出を閉じる" onClick={onClose} className="rounded-full border px-3 py-2">閉じる</button></div>
        <p className="mb-3 text-sm text-slate-600">{place?.visited ? `訪問 ${place.visitCount}回` : "訪問の記録なし"} · {place?.entries.length ?? 0}件の思い出</p>
        {place?.days.length ? place.days.map(day => <section key={day.date ?? "unknown"} className="mt-4"><h4 className="mb-2 text-sm font-bold">{day.date ?? "来場日不明"}</h4>{entriesView(day.entries)}</section>) : <p className="text-sm text-slate-500">この範囲には記録がありません。</p>}
      </aside>;
    }} />
    {model.entries.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-600">この日の記録はまだありません。</p> : null}
    <section aria-label="場所なしの思い出" className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><h2 className="mb-2 font-bold">場所なしの思い出 · {model.unplaced.length}件</h2><p className="mb-4 text-sm text-slate-500">フードやピンバッジもここに残ります。場所を決めていなくても記録を失いません。</p>{entriesView(model.unplaced)}</section>
  </div>;
}
