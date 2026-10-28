"use client";

import {useMapPhotoCapture,type MapCaptureFixture} from './use-map-photo-capture';
import {memoryMapPhotoEntryHref} from '@/lib/memory-map-navigation';
import {mapPointStorageEnabled} from '@/lib/map-point-config';
import {validateMapPoint} from '@/lib/memory-map-point';
import type {VenueMapMarker} from './venue-map-frame';
import {MemoryPhotoViewer} from './memory-photo-viewer';
import {greenExpoMapAnchors} from '@/lib/green-expo-map';
import { useState,useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ActivityLog, Area, PavilionOption, VisitSession } from "@/lib/session-shared";
import { buildMemoryMap, type MemoryEntry } from "@/lib/memory-map";
import { IllustratedMemoryMap } from "./illustrated-memory-map";

type PhotoEntry = ActivityLog & { photoUrl: string | null };
type Props = { captureFixture?:MapCaptureFixture;onEditRecord?:(id:string)=>void; mapPointAvailable?:boolean; eventId?:string|null; initialDate?:string|null;initialPlaceId?:string|null; mapMode?:"illustration"|"geographic"; explicitAnchors?:{pavilionId:string;x:number;y:number}[]; scopeLabel?:string; demo?: boolean; logs: PhotoEntry[]; sessions: VisitSession[]; areas: Area[]; pavilions: PavilionOption[] };
const hydrationSubscription=()=>()=>{};
const clientReady=()=>true;const serverReady=()=>false;
const labels: Record<string, string> = { pavilion_visit: "パビリオン", food: "フード", pin: "ピンバッジ", event_participation: "イベント" };

export function MemoryMapExplorer({ logs, sessions, pavilions, demo = false, explicitAnchors, scopeLabel, mapMode="illustration",initialDate,initialPlaceId,eventId=null,mapPointAvailable=mapPointStorageEnabled,onEditRecord,captureFixture }: Props) {
  const [photoFocus,setPhotoFocus]=useState<{id:string;ids:string[]}|null>(null);
  const interactive=useSyncExternalStore(hydrationSubscription,clientReady,serverReady);
  const [date, setDate] = useState<string | null>(sessions.some(day=>day.visit_date===initialDate)?initialDate!:null);
  const capture=useMapPhotoCapture({fixtureAdapter:captureFixture,enabled:interactive&&(!demo||Boolean(captureFixture))&&mapPointAvailable&&mapMode==='geographic',sessions,pavilions,date});
  const model = buildMemoryMap(logs, sessions, date);
  const photoById = new Map(logs.map(log => [log.id, log]));
  const mappedPlaceIds = new Set(explicitAnchors===undefined?pavilions.map(place=>place.id):explicitAnchors.map(anchor=>anchor.pavilionId));
  const [unmappedFocus,setUnmappedFocus]=useState<string|null>(initialPlaceId&&pavilions.some(p=>p.id===initialPlaceId)&&!mappedPlaceIds.has(initialPlaceId)?initialPlaceId:null);
  const pointEntries=mapPointAvailable&&mapMode==='geographic'?model.entries.filter(entry=>{const p=validateMapPoint(entry.map_point??null,{eventId:entry.event_id??null,pavilionId:entry.pavilion_id,activityType:entry.activity_type??''});return p.ok&&Boolean(p.value);}):[];
  const pointIds=new Set(pointEntries.map(entry=>entry.id));
  const offMapEntries = model.entries.filter(entry => !pointIds.has(entry.id)&&(!entry.pavilion_id || !mappedPlaceIds.has(entry.pavilion_id)));
  const pointMarkers:VenueMapMarker[]=pointEntries.flatMap(entry=>{const parsed=validateMapPoint(entry.map_point,{eventId:entry.event_id??null,pavilionId:null,activityType:entry.activity_type??''});if(!parsed.ok||!parsed.value)return [];const p=parsed.value;return [{id:'point:'+entry.id,name:entry.title||'写真の位置',x:p.x*100,y:p.y*125,paperMemory:true,memoryCount:1,memoryDayCount:1,visited:false,visitCount:0,previewUrl:photoById.get(entry.id)?.photoUrl??null,areaId:'',areaName:'自分で指定した写真の位置',imageUrl:null,bloom:'#e89378',size:1,rotation:0,firstVisitedAt:null,latestVisitedAt:null,latestSessionId:entry.session_id}];});
  const visitedPlaceCount = model.places.filter(place=>place.visited).length;
  const previews = new Map<string, string>();
  for (const entry of model.entries.slice().reverse()) { const url = photoById.get(entry.id)?.photoUrl; if (entry.pavilion_id && url && !previews.has(entry.pavilion_id)) previews.set(entry.pavilion_id, url); }
  const focusedPhotos=photoFocus?model.entries.filter(entry=>photoFocus.ids.includes(entry.id)&&Boolean(photoById.get(entry.id)?.photoUrl)).map(entry=>({id:entry.id,url:photoById.get(entry.id)!.photoUrl!,title:entry.title||'思い出の写真',date:sessions.find(day=>day.id===entry.session_id)?.visit_date??null,onEdit:onEditRecord?()=>{setPhotoFocus(null);onEditRecord(entry.id);}:undefined,editHref:demo?undefined:`/sessions/${entry.session_id}/activity-logs/${entry.id}/edit?return=map`})):[];
  function entriesView(entries: MemoryEntry[],anchorIds=true) {
    return <ul className="grid grid-cols-2 gap-3">{entries.map(entry => {
      const photo = photoById.get(entry.id);
      return <li id={anchorIds?`memory-entry-${entry.id}`:undefined} key={entry.id} className="min-w-0 overflow-hidden rounded-2xl border border-[#e9e2d6] bg-[#fffdf8] p-2.5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-1"><span className="text-xs text-slate-600">{labels[entry.activity_type ?? ""] ?? "思い出"}</span>
          {demo ? onEditRecord?<button type="button" className="min-h-11 text-xs underline" onClick={()=>onEditRecord(entry.id)}>合成記録を編集</button>:<span className="text-xs text-slate-600">サンプル・保存なし</span> : <Link className="text-xs underline" href={`/sessions/${entry.session_id}/activity-logs/${entry.id}/edit?return=map`}>記録を見る</Link>}</div>
        {!demo&&(!entry.pavilion_id||!mappedPlaceIds.has(entry.pavilion_id))?<Link className="mb-2 inline-flex min-h-11 items-center rounded-full border border-[#99ad98] px-3 text-sm font-semibold text-[#234b3b]" href={`/sessions/${entry.session_id}/activity-logs/${entry.id}/edit?return=map#related-place`}>{entry.pavilion_id?"場所を確認する":"場所を指定する"}</Link>:null}
        <p className="break-words text-sm font-semibold leading-6 text-[#233f35]">{entry.title || "名前なし"}</p>
        {photo?.place_context_label?<p className="text-xs text-slate-600">{photo.place_context_label}</p>:null}
        {photo?.photoUrl ? <button type="button" aria-label={`${entry.title||"思い出"}の写真を大きく見る`} onClick={()=>setPhotoFocus({id:entry.id,ids:entries.map(item=>item.id)})} className="relative mt-2 block w-full overflow-hidden rounded-xl focus-visible:outline-4 focus-visible:outline-[#a94035]"><Image unoptimized width={600} height={400} src={photo.photoUrl} alt={entry.title || "思い出の写真"} className="aspect-square w-full object-cover" /><span className="absolute bottom-2 right-2 rounded-full bg-[#153c32]/90 px-2 py-1 text-xs text-white">写真を開く</span></button> : <div className="mt-2 flex aspect-[4/3] items-center justify-center rounded-xl bg-[#efeddf] text-xs text-[#425c4d]">写真なし</div>}
      </li>;
    })}</ul>;
  }
  const photoEntryHref=memoryMapPhotoEntryHref(sessions,eventId,date);
  return <div className="space-y-5">
    {capture.content}
    {photoFocus&&focusedPhotos.some(photo=>photo.id===photoFocus.id)?<MemoryPhotoViewer photos={focusedPhotos} selectedId={photoFocus.id} onSelect={id=>setPhotoFocus({...photoFocus,id})} onClose={()=>setPhotoFocus(null)} />:null}
    {!demo?<div className="rounded-2xl border border-[#d7dfcf] bg-white p-4"><Link href={photoEntryHref} className="inline-flex rounded-full bg-[#a94035] px-5 py-3 font-semibold text-white">写真から記録する</Link><p className="mt-2 text-sm text-[#425748]">{date?`${date}の記録`:"来場日を選んで記録"} · 写真や場所はあとからでも指定できます。</p></div>:null}
    {scopeLabel?<p role="status" className="text-sm text-slate-600">{scopeLabel}</p>:null}
    {explicitAnchors!==undefined&&offMapEntries.length>0?<p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">地図位置未対応 {offMapEntries.length}件は下の一覧に残ります。画像には配置済みの場所だけを表示します。</p>:null}
    <nav aria-label="地図の日付" className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={!interactive} aria-pressed={date === null} onClick={() => setDate(null)} className={`rounded-full border px-4 py-2 text-sm ${date === null ? "border-[#a94035] bg-[#a94035] text-white" : "border-[#e5dfd1] bg-[#fffcf5] text-[#38594a]"}`}>全日程</button>
      {model.dates.slice(0,4).map(day=><button key={day} type="button" disabled={!interactive} aria-label={`${day}の記録を見る`} aria-pressed={date===day} onClick={()=>setDate(day)} className={`rounded-full border px-4 py-2 text-sm ${date===day?"border-[#a94035] bg-[#a94035] text-white":"border-[#e5dfd1] bg-[#fffcf5] text-[#38594a]"}`}>{day.slice(5).replace('-','/')}</button>)}
      <label className={model.dates.length<=4?"hidden":"text-sm text-slate-700"}><span className="sr-only">1日を選ぶ</span> <select disabled={!interactive} aria-label="地図に表示する来場日" value={date ?? ""} onChange={event => setDate(event.target.value || null)} className="ml-2 rounded-lg border bg-white px-3 py-2"><option value="">全日程</option>{model.dates.map(day => <option key={day} value={day}>{day}</option>)}</select></label>
      <p role="status" className="w-full text-sm text-slate-600">{date ?? "全日程"} · {model.entries.length}件の思い出 · {visitedPlaceCount}か所訪問</p>
    </nav>
    <IllustratedMemoryMap onMapTap={capture.beginCapture} pointMarkers={pointMarkers} focusPlaceId={initialPlaceId} mapMode={mapMode} explicitAnchors={explicitAnchors} pavilions={pavilions} places={model.places} previews={previews} daily={date !== null} title={date ? `${date}の思い出` : "わたしの思い出マップ"} renderPlaceDetail={(id, onClose) => {
      const pointRecord=id.startsWith('point:')?pointEntries.find(entry=>entry.id===id.slice(6)):null;
      if(pointRecord)return <aside aria-label="写真の位置の思い出" className="pointer-events-auto absolute inset-x-0 bottom-0 top-2 z-30 overflow-y-auto rounded-t-3xl border bg-[#fffcf5] p-4 sm:inset-x-auto sm:right-4 sm:w-[390px] sm:rounded-3xl" onPointerDown={event=>event.stopPropagation()}><header className="mb-3 flex items-center justify-between gap-3"><h3 className="font-bold">{pointRecord.title||'写真の位置'}</h3><button type="button" aria-label="写真の位置を閉じる" className="min-h-11 rounded-full border px-4" onClick={onClose}>閉じる</button></header><p className="mb-3 text-xs leading-5">自分で確認した写真の位置です。施設の訪問数には含めません。図上の推定・手動位置で、地図の誤差は不明です。</p>{entriesView([pointRecord])}</aside>;
      const place = model.places.find(item => item.id === id);
      const targetDay = sessions.find(day=>date?day.visit_date===date:day.visit_date===place?.days[0]?.date)??sessions[0];
      return <aside aria-label="場所の思い出" className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 top-2 max-h-[calc(100%-8px)] overflow-y-auto overscroll-contain rounded-t-[26px] border border-[#e6dfcf] bg-[#fffcf5] p-4 shadow-xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:top-4 sm:w-[390px] sm:rounded-[26px]" onPointerDown={event => event.stopPropagation()}>
        <div className="sticky -top-4 z-10 -mx-4 mb-3 flex items-center justify-between gap-3 border-b border-[#e8e0d0] bg-[#fffcf5]/95 p-4 backdrop-blur"><h3 className="font-bold">{pavilions.find(item => item.id === id)?.name ?? "場所未登録"}</h3><button type="button" aria-label="場所の思い出を閉じる" onClick={onClose} className="rounded-full border px-3 py-2">閉じる</button></div>
        {mapMode==="geographic"?<p className="mb-3 rounded-xl bg-[#f2efe2] p-3 text-xs leading-5 text-[#425c4d]">公開図からの推定掲載点です。入口・建物中心・現地測量点ではありません。{greenExpoMapAnchors.find(a=>a.pavilionId===id)?.extrapolated?'基準点の範囲外への推定を含みます。':''} 誤差は不明です。</p>:null}
        <p className="mb-3 text-sm text-slate-600">{place?.visited ? `訪問 ${place.visitCount}回` : "訪問の記録なし"} · {place?.entries.length ?? 0}件の思い出</p>
        {!demo&&targetDay?<Link href={`/sessions/${targetDay.id}/activities/new?place=${encodeURIComponent(id)}&return=map`} className="mb-3 inline-flex rounded-full bg-[#a94035] px-5 py-3 text-sm font-semibold text-white">この場所の思い出を追加</Link>:null}
        {place?.days.length ? place.days.map(day => <section key={day.date ?? "unknown"} className="mt-4"><h4 className="mb-3 flex items-center justify-between border-t border-[#e6dfcf] pt-4 text-base font-semibold text-[#234b3b]"><span>{day.date ?? "来場日不明"}</span><span className="text-xs font-normal">{day.entries.length}件</span></h4>{entriesView(day.entries)}</section>) : <p className="text-sm text-slate-600">この範囲には記録がありません。</p>}
      </aside>;
    }} />
    {model.entries.length === 0 ? <p className="rounded-xl border border-dashed p-5 text-sm text-slate-600">この日の記録はまだありません。</p> : null}
    {unmappedFocus?<section aria-label="位置未対応の場所の思い出" className="rounded-[24px] border border-[#e3c997] bg-[#fff9ea] p-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-bold">{pavilions.find(p=>p.id===unmappedFocus)?.name}</h2><button type="button" onClick={()=>setUnmappedFocus(null)} className="rounded-full border px-3 py-2 text-sm">閉じる</button></div><p className="mb-4 text-xs leading-5">保存した場所はそのままです。位置未対応のため地図に座標を創作せず、日付ごとの記録をここに残します。</p>{model.places.find(p=>p.id===unmappedFocus)?.days.map(day=><section key={day.date??'unknown'} className="mt-4"><h3 className="mb-3 font-semibold">{day.date??'来場日不明'} · {day.entries.length}件</h3>{entriesView(day.entries)}</section>)??<p className="text-sm">この範囲の記録はありません。</p>}</section>:null}
    <section id="unplaced-memories" aria-label="場所なしの思い出" className="rounded-[24px] border border-[#e6dfcf] bg-[#fffcf5] p-5"><h2 className="mb-2 font-bold">場所なし・地図未配置の思い出 · {offMapEntries.length}件</h2><p className="mb-4 text-sm text-slate-600">写真がある未配置記録 {offMapEntries.filter(entry=>photoById.get(entry.id)?.photoUrl).length}件。場所を決めていない記録も失われません。「場所を指定する」から編集できます。</p>{entriesView(offMapEntries,!unmappedFocus)}</section>
  </div>;
}
