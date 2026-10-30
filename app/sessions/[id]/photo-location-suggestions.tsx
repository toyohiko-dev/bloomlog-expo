"use client";
import {projectedMapPoint,type MapPointDraft} from '@/lib/memory-map-point';
import {useEffect,useRef,useState} from 'react';
import {readPhotoGps,type PhotoCoordinates} from '@/lib/photo-metadata';
import {rankNearbyPlaces,requestCurrentPosition} from '@/lib/place-location';
import {placeRegistry} from '@/lib/place-coordinate-catalog';
import {makePlaceContext,describePlaceContext,type PlaceContext} from '@/lib/place-context';
import {placeContextStorageEnabled} from '@/lib/place-context-config';
import {greenExpoResearch,registeredResearchPavilion} from '@/lib/green-expo-research';
import {coordinatesForEvent,reviewedBindings} from '@/lib/place-registry';
import {researchPlacesForEvent,nearbyResearchPlaces,indoorOccurrencesOn} from '@/lib/green-expo-research';
import type {PavilionOption} from '@/lib/session-shared';
export function PhotoLocationSuggestions({photo,pavilions,onSelect,disabled=false,eventId=null,visitDate='',onContextSelect,onPointSuggest,photoOrigin='gallery',deviceLocationEnabled=true}:{deviceLocationEnabled?:boolean;onPointSuggest?:(point:MapPointDraft)=>void;photoOrigin?:'gallery'|'camera'|'none';onContextSelect?:(pavilionId:string,context:PlaceContext)=>void;visitDate?:string;eventId?:string|null;photo:File|null;pavilions:PavilionOption[];onSelect:(id:string)=>void;disabled?:boolean}){
 const [photoPosition,setPhotoPosition]=useState<PhotoCoordinates|null>(null);
 const [position,setPosition]=useState<PhotoCoordinates|null>(null);
 const [researchId,setResearchId]=useState('');
 const [source,setSource]=useState<'photo'|'current'|null>(null);
 const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 const request=useRef<AbortController|null>(null);
 useEffect(()=>{let active=true;request.current?.abort();setBusy(false);setPosition(null);setSource(null);setPhotoPosition(null);setResearchId('');
  if(photo){setNotice('写真を撮った場所を調べています。');readPhotoGps(photo).then(point=>{if(!active)return;setPhotoPosition(point);if(point){setPosition(point);setSource('photo');}setNotice(point?'写真を撮った場所の近くにある施設です。合うものがなければ、選ばずに保存できます。':'この写真からは撮った場所が分かりませんでした。自分で選ぶか、あとで決められます。');}).catch(()=>{if(active)setNotice('写真を撮った場所は分かりませんでした。写真はそのまま保存できます。');});}
  else setNotice('場所は地図や施設名から選べます。');
  return()=>{active=false;request.current?.abort();};
 },[photo,eventId]);
 const catalog=coordinatesForEvent(placeRegistry,eventId,new Set(pavilions.map(place=>place.id)));
 const researchCatalog=researchPlacesForEvent(eventId);
 const researchNearby=position?nearbyResearchPlaces(position,eventId):[];
 const researchPlace=researchCatalog.find(p=>p.sourceId===researchId);
 const indoor=researchPlace?indoorOccurrencesOn(visitDate,researchPlace.sourceId):[];
 const parentResearchPlace=researchPlace?.parentId?researchCatalog.find(p=>p.sourceId===researchPlace.parentId):researchPlace;
 const registeredId=parentResearchPlace?registeredResearchPavilion(parentResearchPlace,new Map(reviewedBindings(placeRegistry).filter(p=>p.pavilionId).map(p=>[p.sourceId,p.pavilionId!])),new Set(pavilions.map(p=>p.id))):null;
 const canChooseContext=Boolean(placeContextStorageEnabled&&registeredId&&parentResearchPlace&&!parentResearchPlace.coordinate?.conflict&&onContextSelect);
 function chooseContext(occurrenceId:string|null=null){if(!canChooseContext||!registeredId||!parentResearchPlace||!onContextSelect)return;onContextSelect(registeredId,makePlaceContext(greenExpoResearch,parentResearchPlace.sourceId,researchPlace?.parentId?researchPlace.sourceId:null,occurrenceId));}
 const hasRegisteredResearch=reviewedBindings(placeRegistry).some(p=>p.eventId===eventId&&pavilions.some(item=>item.id===p.pavilionId));
 const hasCoordinates=catalog.length>0||researchCatalog.some(p=>p.gpsEnabled);
 const places=rankNearbyPlaces(position&&position.accuracy<=150?position:{latitude:NaN,longitude:NaN,accuracy:0},catalog).filter(p=>pavilions.some(item=>item.id===p.pavilionId));
 async function locate(){if(!deviceLocationEnabled)return;request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setPosition(null);setSource('current');setNotice('今いる場所を調べています。写真の場所は自動で変わりません。');
  try{const point=await requestCurrentPosition(navigator.geolocation,controller.signal);if(controller.signal.aborted)return;setPosition(point);setNotice(point.accuracy>150?'現在地がはっきり分かりません。地図や施設名から選んでください。':'近くにある施設です。合う場所を選んでください。');}
  catch(e){if(request.current!==controller)return;const code=e instanceof Error?e.message:'';setNotice(code==='denied'?'現在地を使えませんでした。場所は自分で選べます。':code==='cancelled'?'現在地を調べるのをやめました。入力した内容は残っています。':code==='timeout'?'現在地が分かりませんでした。もう一度試すか、場所を自分で選んでください。':'現在地が分かりませんでした。地図や施設名から選んで保存できます。');}
  finally{if(request.current===controller)setBusy(false);}
 }
 return <div className="space-y-3 rounded-2xl bg-[#f3f5ed] p-4">
  <p className="text-sm font-semibold text-[#275447]">近くの場所を探す</p>
  <p className="text-xs leading-5 text-slate-600">撮った場所や今いる場所の近くから探せます。写真の場所は、選ぶまで変わりません。</p>
  <div className="flex flex-wrap gap-2">
   {photoPosition&&source!=='photo'?<button type="button" disabled={disabled||busy||!hasCoordinates} onClick={()=>{setPosition(photoPosition);setSource('photo');setNotice('写真を撮った場所の近くにある施設です。合う場所を選んでください。');}} className="rounded-full border bg-white px-4 py-2 text-sm">写真を撮った場所から探す</button>:null}
   <button type="button" disabled={disabled||busy||!hasCoordinates||!deviceLocationEnabled} onClick={locate} className="rounded-full border bg-white px-4 py-2 text-sm">今いる場所から探す</button>
   {busy?<button type="button" onClick={()=>request.current?.abort()} className="rounded-full border bg-white px-4 py-2 text-sm">現在地を調べるのをやめる</button>:null}
  </div>
  {position&&onPointSuggest&&(source==='photo'||photoOrigin!=='gallery')?<button type="button" disabled={disabled||busy} className="min-h-11 rounded-full border bg-white px-4 py-2 text-sm" onClick={()=>{const point=projectedMapPoint(position,source==='photo'?'photo-exif':'current-gps',photoOrigin);if(point)onPointSuggest(point);else setNotice('この地図の外にあるようです。地図で場所を選ぶか、あとで決めてください。');}}>地図で場所を確かめる</button>:null}
  {catalog.length===0&&!hasRegisteredResearch?<p className="text-xs text-amber-800">{researchCatalog.length?'施設の情報は見られますが、まだ保存する場所には選べません。':'このイベントでは、近くの場所を探す機能を準備しています。'} 下の一覧から場所を選べます。</p>:null}
  <p role="status" aria-live="polite" className="text-xs leading-5 text-slate-600">{notice}</p>
  {position?<p className="text-xs text-slate-500">{source==='photo'?'写真を撮ったおおよその場所':'現在地'}を使用。{catalog.length===0?'近くの施設はまだ探せません。下の一覧から選んでください。':places.length===0?'近くの施設が見つかりませんでした。下の一覧から選べます。':'距離と場所は目安です。実際の入口とは異なることがあります。'}</p>:null}
  {position&&onContextSelect?researchNearby.map(({place,distanceMeters})=>{
    const parent=place.parentId?researchCatalog.find(p=>p.sourceId===place.parentId):place;
    const binding=parent?reviewedBindings(placeRegistry).find(b=>b.eventId===eventId&&b.sourceId===parent.sourceId&&pavilions.some(p=>p.id===b.pavilionId)):null;
    if(!binding?.pavilionId||!parent||parent.coordinate?.conflict||!placeContextStorageEnabled)return null;
    return <button key={'quick-'+place.sourceId} type="button" disabled={disabled} onClick={()=>onContextSelect(binding.pavilionId!,makePlaceContext(greenExpoResearch,parent.sourceId,place.parentId?place.sourceId:null))} className="block min-h-11 w-full rounded-2xl border border-[#a8c3aa] bg-white p-3 text-left"><span className="block text-sm font-semibold text-[#254d3e]">{place.name}を選ぶ</span><span className="text-xs text-slate-600">{source==='photo'?'写真の位置':'現在地'}の近く · 約{distanceMeters}m（目安）</span></button>;
   }):null}
  {researchCatalog.length>0?<details className="rounded-xl border border-amber-200 bg-white p-3" open={position?true:undefined}>
   <summary className="cursor-pointer text-sm font-medium">場所を一覧から探す</summary>
   <p className="mt-2 text-xs leading-5 text-slate-600">施設を選ぶと詳しい情報が見られます。地図上の場所や距離は目安で、実際の入口とは異なることがあります。</p>
   {position&&researchNearby.length===0?<p className="mt-2 text-xs">近くの施設が見つからない場合も、下の一覧から探せます。</p>:null}
   <div className="my-3 space-y-2">{researchNearby.map(({place,distanceMeters})=><button type="button" disabled={disabled} key={place.sourceId} onClick={()=>setResearchId(place.sourceId)} className="block w-full rounded-xl border p-3 text-left text-sm">{place.name}<span className="block text-xs text-slate-500">おおよその距離 約{distanceMeters}m · 詳しく見る</span></button>)}</div>
   <label className="block text-xs">場所を選ぶ<select aria-label="公開資料の施設・区画" value={researchPlace?.sourceId??''} onChange={e=>setResearchId(e.target.value)} className="mt-2 w-full rounded-xl border p-3" disabled={disabled}><option value="">選んで確認</option>{researchCatalog.map(p=><option key={p.sourceId} value={p.sourceId}>{p.name}{p.parentId?'（施設内）':''}{!p.coordinate?' · 位置未確認':''}</option>)}</select></label>
   {researchPlace?<div className="mt-3 space-y-2 text-xs leading-5"><p className="font-semibold">{researchPlace.name}</p><p>{researchPlace.categories.join(' / ')}</p><p>{canChooseContext?(placeRegistry.places.some(place=>place.sourceId===researchPlace.sourceId&&placeRegistry.anchors.some(anchor=>anchor.pavilionId===place.pavilionId))?'この場所で保存できます。地図にはおおよその場所が表示されます。':'この場所で保存できますが、まだ地図には表示されません。'):'この場所はまだ選べません。地図の表示も準備中です。'}実際の入口とは異なることがあります。</p>{researchPlace.coordinate?.extrapolated?<p className="text-amber-800">場所が大きくずれている可能性があります。</p>:null}{researchPlace.coordinate?.conflict?<p className="text-amber-800">資料によって場所の説明が異なるため、位置は確認中です。</p>:null}{!researchPlace.gpsEnabled?<p>場所がまだ分からないため、近くの施設には表示していません。</p>:null}
   <button type="button" disabled={disabled||!canChooseContext} onClick={()=>chooseContext()} className="rounded-full border px-4 py-2">この場所を選ぶ</button>
   {researchPlace.sourceId==='organizer-hanameguri'?<div><p className="font-medium">{visitDate||'来場日を選んでください'} に見られる出展 {indoor.length}件</p><p>選んだ来場日に見られる出展です。館内の詳しい場所は地図に表示されません。</p><ul className="max-h-64 overflow-y-auto rounded-lg border p-2">{indoor.map(o=><li key={o.id} className="border-b py-2">{o.exhibitor_name_raw} · {o.building_sections.join('/')}<button type="button" disabled={disabled||!canChooseContext} onClick={()=>chooseContext(o.id)} className="ml-2 rounded border px-2 py-1">この出展を選ぶ</button><span className="block">{o.dateCertainty==='within-period-seven-days-unconfirmed'?'開催日はまだ決まっていません（期間中の7日間）':`${o.precise_start_date}〜${o.precise_end_date_inclusive}`}</span></li>)}</ul>{indoor.length===0?<p>この日の出展情報はまだありません。</p>:null}<p>{canChooseContext?'出展を選ぶと、施設名と一緒に記録できます。':'この出展はまだ選べません。'}</p></div>:null}</div>:null}
  </details>:null}
  {places.map(place=><button type="button" key={place.pavilionId} disabled={disabled} onClick={()=>onSelect(place.pavilionId)} className="block w-full rounded-xl border border-[#bbd0be] bg-white px-4 py-3 text-left text-sm">{pavilions.find(p=>p.id===place.pavilionId)?.name} · 約{place.distanceMeters}m {place.estimated?'（目安）':''}</button>)}
 </div>;
}

export function SelectedPhotoPreview({photo}:{photo:File|null}){
 const image=useRef<HTMLImageElement>(null);
 useEffect(()=>{if(!photo||!image.current)return;const url=URL.createObjectURL(photo);image.current.src=url;return()=>URL.revokeObjectURL(url);},[photo]);
 return photo?<div className="mt-3">{/* eslint-disable-next-line @next/next/no-img-element -- Local Blob URL assigned by the preview effect. */}
 <img ref={image} alt="保存前の選択写真" className="max-h-64 w-full rounded-2xl object-contain" /></div>:null;
}

export function PlaceContextSummary({context}:{context:PlaceContext|null}){return context?<p className="text-xs leading-5 text-slate-600">{describePlaceContext(context,greenExpoResearch)}</p>:null;}
