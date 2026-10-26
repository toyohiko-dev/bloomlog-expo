"use client";
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
export function PhotoLocationSuggestions({photo,pavilions,onSelect,disabled=false,eventId=null,visitDate='',onContextSelect}:{onContextSelect?:(pavilionId:string,context:PlaceContext)=>void;visitDate?:string;eventId?:string|null;photo:File|null;pavilions:PavilionOption[];onSelect:(id:string)=>void;disabled?:boolean}){
 const [photoPosition,setPhotoPosition]=useState<PhotoCoordinates|null>(null);
 const [position,setPosition]=useState<PhotoCoordinates|null>(null);
 const [researchId,setResearchId]=useState('');
 const [source,setSource]=useState<'photo'|'current'|null>(null);
 const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 const request=useRef<AbortController|null>(null);
 useEffect(()=>{let active=true;request.current?.abort();setBusy(false);setPosition(null);setSource(null);setPhotoPosition(null);setResearchId('');
  if(photo){setNotice('写真の位置情報を端末内で確認しています。');readPhotoGps(photo).then(point=>{if(!active)return;setPhotoPosition(point);if(point){setPosition(point);setSource('photo');}setNotice(point?'写真の撮影位置から候補を表示しています。選ばずに場所をあとで指定することもできます。':'読み取れる撮影位置がありません。場所を選ぶか、あとで指定できます。JPEG以外の位置情報読取りは未対応です。');}).catch(()=>{if(active)setNotice('写真の位置情報を読めませんでした。写真と入力はそのまま使えます。');});}
  else setNotice('位置情報を使わずに場所を選べます。');
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
 async function locate(){request.current?.abort();const controller=new AbortController();request.current=controller;setBusy(true);setPosition(null);setSource('current');setNotice('現在地を確認中。写真の撮影場所としては扱いません。');
  try{const point=await requestCurrentPosition(navigator.geolocation,controller.signal);if(controller.signal.aborted)return;setPosition(point);setNotice(point.accuracy>150?'現在地の精度が低いため、場所を自分で選んでください。':'現在地を取得しました。候補は確認して選んでください。');}
  catch(e){if(request.current!==controller)return;const code=e instanceof Error?e.message:'';setNotice(code==='denied'?'現在地は許可されませんでした。場所選択と記録は続けられます。':code==='cancelled'?'現在地の取得を取り消しました。入力は保持しています。':code==='timeout'?'現在地の確認が時間切れになりました。再試行するか場所を選べます。':'現在地を取得できませんでした。場所を選んで記録できます。');}
  finally{if(request.current===controller)setBusy(false);}
 }
 return <div className="space-y-3 rounded-2xl bg-[#f3f5ed] p-4">
  <p className="text-sm font-semibold text-[#275447]">場所を選ぶ・あとで指定する</p>
  <p className="text-xs leading-5 text-slate-600">位置情報は候補の提案だけに使います。過去の写真に現在地を自動で当てはめません。撮影場所と購入店が違う場合は、下の場所選択で変更してください。</p>
  <div className="flex flex-wrap gap-2">
   {photoPosition&&source!=='photo'?<button type="button" disabled={disabled||busy||!hasCoordinates} onClick={()=>{setPosition(photoPosition);setSource('photo');setNotice('写真の撮影位置からの候補です。場所は自分で確定してください。');}} className="rounded-full border bg-white px-4 py-2 text-sm">写真の撮影位置から候補</button>:null}
   <button type="button" disabled={disabled||busy||!hasCoordinates} onClick={locate} className="rounded-full border bg-white px-4 py-2 text-sm">今いる場所から候補</button>
   {busy?<button type="button" onClick={()=>request.current?.abort()} className="rounded-full border bg-white px-4 py-2 text-sm">位置取得を取り消す</button>:null}
  </div>
  {catalog.length===0&&!hasRegisteredResearch?<p className="text-xs text-amber-800">{researchCatalog.length?'公開資料は確認できますが、記録先としての公開・有効化はまだです。資料を選んでも保存先は変わりません。':'このイベントの施設座標は未接続です。'} 下の場所一覧と最近の場所は使えます。</p>:null}
  <p role="status" aria-live="polite" className="text-xs leading-5 text-slate-600">{notice}</p>
  {position?<p className="text-xs text-slate-500">{source==='photo'?'写真の撮影位置（GPS精度は不明）':'現在地'}を使用。{catalog.length===0?'施設座標の対応は準備中です。候補を創作せず、下の一覧から選べます。':places.length===0?'近隣の候補は見つかりません。会場外・低精度の場合も一覧から選べます。':'図面推定の候補は入口位置や距離の正確さを保証しません。'}</p>:null}
  {position&&onContextSelect?researchNearby.map(({place,distanceMeters})=>{
    const parent=place.parentId?researchCatalog.find(p=>p.sourceId===place.parentId):place;
    const binding=parent?reviewedBindings(placeRegistry).find(b=>b.eventId===eventId&&b.sourceId===parent.sourceId&&pavilions.some(p=>p.id===b.pavilionId)):null;
    if(!binding?.pavilionId||!parent||parent.coordinate?.conflict||!placeContextStorageEnabled)return null;
    return <button key={'quick-'+place.sourceId} type="button" disabled={disabled} onClick={()=>onContextSelect(binding.pavilionId!,makePlaceContext(greenExpoResearch,parent.sourceId,place.parentId?place.sourceId:null))} className="block min-h-11 w-full rounded-2xl border border-[#a8c3aa] bg-white p-3 text-left"><span className="block text-sm font-semibold text-[#254d3e]">{place.name}を記録先にする</span><span className="text-xs text-slate-600">{source==='photo'?'写真の位置':'現在地'}からの候補 · 図上の概算 約{distanceMeters}m · 自分で変更できます</span></button>;
   }):null}
  {researchCatalog.length>0?<details className="rounded-xl border border-amber-200 bg-white p-3" open={position?true:undefined}>
   <summary className="cursor-pointer text-sm font-medium">公開資料の施設候補</summary>
   <p className="mt-2 text-xs leading-5 text-slate-600">図面からの推定で、現地未検証・入口位置ではありません。誤差は不明です。250mは候補を探す範囲で精度ではありません。場所は自動確定しません。</p>
   {position&&researchNearby.length===0?<p className="mt-2 text-xs">候補なし・会場外・低精度の場合も、下の一覧で確認できます。</p>:null}
   <div className="my-3 space-y-2">{researchNearby.map(({place,distanceMeters})=><button type="button" disabled={disabled} key={place.sourceId} onClick={()=>setResearchId(place.sourceId)} className="block w-full rounded-xl border p-3 text-left text-sm">{place.name}<span className="block text-xs text-slate-500">図上の概算距離 約{distanceMeters}m · 資料の詳細を見る</span></button>)}</div>
   <label className="block text-xs">施設・区画の資料を確認<select aria-label="公開資料の施設・区画" value={researchPlace?.sourceId??''} onChange={e=>setResearchId(e.target.value)} className="mt-2 w-full rounded-xl border p-3" disabled={disabled}><option value="">選んで確認</option>{researchCatalog.map(p=><option key={p.sourceId} value={p.sourceId}>{p.name}{p.parentId?'（施設内）':''}{!p.coordinate?' · 位置未確認':''}</option>)}</select></label>
   {researchPlace?<div className="mt-3 space-y-2 text-xs leading-5"><p className="font-semibold">{researchPlace.name}</p><p>{researchPlace.categories.join(' / ')}</p><p>{canChooseContext?(placeRegistry.places.some(place=>place.sourceId===researchPlace.sourceId&&placeRegistry.anchors.some(anchor=>anchor.pavilionId===place.pavilionId))?'記録先に選べます。地図には公開図からの推定位置で表示します。':'記録先に選べます。地図位置は未対応です。'):'記録先としての公開・有効化待ちです。地図位置も未対応です。'}現地での位置・入口は未検証です。</p>{researchPlace.coordinate?.extrapolated?<p className="text-amber-800">基準点の範囲外への推定を含みます。</p>:null}{researchPlace.coordinate?.conflict?<p className="text-amber-800">公開資料間で区画表記が一致していません。現地確認が必要です。</p>:null}{!researchPlace.gpsEnabled?<p>現在地候補には使っていない資料です。位置未確定・旧図面の項目を含みます。</p>:null}
   <button type="button" disabled={disabled||!canChooseContext} onClick={()=>chooseContext()} className="rounded-full border px-4 py-2">この場所を記録先にする</button>
   {researchPlace.sourceId==='organizer-hanameguri'?<div><p className="font-medium">{visitDate||'来場日未選択'} の出展候補 {indoor.length}件</p><p>出展回は別施設ではありません。館内の位置は未対応です。選んだ来場日で絞っています。</p><ul className="max-h-64 overflow-y-auto rounded-lg border p-2">{indoor.map(o=><li key={o.id} className="border-b py-2">{o.exhibitor_name_raw} · {o.building_sections.join('/')}<button type="button" disabled={disabled||!canChooseContext} onClick={()=>chooseContext(o.id)} className="ml-2 rounded border px-2 py-1">この出展回を選ぶ</button><span className="block">{o.dateCertainty==='within-period-seven-days-unconfirmed'?'期間内の7日間・日程未確定':`${o.precise_start_date}〜${o.precise_end_date_inclusive}`}</span></li>)}</ul>{indoor.length===0?<p>この来場日の出展候補は資料にありません。</p>:null}<p>{canChooseContext?'出展回を選ぶと、この館の記録に詳細を付けられます。':'出展回の記録先は有効化待ちです。既存の記録は変わりません。'}</p></div>:null}</div>:null}
  </details>:null}
  {places.map(place=><button type="button" key={place.pavilionId} disabled={disabled} onClick={()=>onSelect(place.pavilionId)} className="block w-full rounded-xl border border-[#bbd0be] bg-white px-4 py-3 text-left text-sm">{pavilions.find(p=>p.id===place.pavilionId)?.name} · 約{place.distanceMeters}m {place.estimated?'（図面推定）':''}</button>)}
 </div>;
}

export function SelectedPhotoPreview({photo}:{photo:File|null}){
 const image=useRef<HTMLImageElement>(null);
 useEffect(()=>{if(!photo||!image.current)return;const url=URL.createObjectURL(photo);image.current.src=url;return()=>URL.revokeObjectURL(url);},[photo]);
 return photo?<div className="mt-3">{/* eslint-disable-next-line @next/next/no-img-element -- Local Blob URL assigned by the preview effect. */}
 <img ref={image} alt="保存前の選択写真" className="max-h-64 w-full rounded-2xl object-contain" /></div>:null;
}

export function PlaceContextSummary({context}:{context:PlaceContext|null}){return context?<p className="text-xs leading-5 text-slate-600">{describePlaceContext(context,greenExpoResearch)}</p>:null;}
