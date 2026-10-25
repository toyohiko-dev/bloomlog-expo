"use client";

import {GREEN_EXPO_MAP_ART} from '@/lib/green-expo-map';
import type { ReactNode } from "react";
import type { PavilionOption } from "@/lib/session-shared";
import type { MemoryPlace } from "@/lib/memory-map";
import { VenueMapFrame, type VenueMapMarker, type MapArtwork } from "./venue-map-frame";
import { VenueMapExport } from "./venue-map-export";

export const MEMORY_MAP_ART: MapArtwork = { href: "/art/memory-garden-v1.png", viewBox: "0 0 100 150", width: 100, height: 150 };
// Illustration anchors are a presentation layout, never geographic coordinates.
const anchors = [[49,32],[26,49],[74,49],[50,66],[22,79],[78,80],[28,107],[72,107],[51,122],[51,93]];
export function buildIllustratedMarkers(pavilions: PavilionOption[], places: MemoryPlace[], previews: Map<string,string>, daily: boolean, explicitAnchors?: {pavilionId:string;x:number;y:number}[],artwork:MapArtwork=MEMORY_MAP_ART,paperMemory=false): VenueMapMarker[] {
  const unique = [...new Map(pavilions.map(place => [place.id, place])).values()].filter(place=>explicitAnchors===undefined||explicitAnchors.some(anchor=>anchor.pavilionId===place.id));
  const byId = new Map(places.map(place => [place.id,place]));
  return unique.map((pavilion,index) => {
    const place = byId.get(pavilion.id);
    const colorIndex=Array.from(pavilion.id).reduce((n,ch)=>n+ch.charCodeAt(0),0)%4;
    const explicit=explicitAnchors?.find(anchor=>anchor.pavilionId===pavilion.id);
    const [x,y] = explicit ? [explicit.x*artwork.width,explicit.y*artwork.height] : unique.length <= anchors.length ? anchors[index] : [12 + index % Math.ceil(Math.sqrt(unique.length)) * 76 / Math.max(1,Math.ceil(Math.sqrt(unique.length))-1), 22 + Math.floor(index / Math.ceil(Math.sqrt(unique.length))) * 105 / Math.max(1,Math.ceil(unique.length / Math.ceil(Math.sqrt(unique.length)))-1)];
    return { paperMemory,memoryDayCount:place?.days?.length??0,id:pavilion.id, name:pavilion.name, x,y, areaId:pavilion.area_id ?? "", areaName:paperMemory?"公開図からの推定位置":"イメージ配置", visited:place?.visited ?? false, visitCount:place?.visitCount ?? 0, memoryCount:place?.entries.length ?? 0, previewUrl:daily||(paperMemory&&(place?.entries.length??0)>=4) ? previews.get(pavilion.id) : null, imageUrl:null, bloom:["#ee7869","#d28eaf","#e3b75d","#73a58b"][colorIndex], size:1, rotation:0, firstVisitedAt:null, latestVisitedAt:null, latestSessionId:null };
  });
}
export function mapExportUnavailableReason(markers:VenueMapMarker[],places:MemoryPlace[],hasExplicitAnchors:boolean){return hasExplicitAnchors&&markers.length===0&&places.some(p=>p.entries.length>0)?'記録の地図位置が未対応のため、この範囲はまだ画像にできません。記録は下の一覧で見返せます。':undefined;}
export function IllustratedMemoryMap({ pavilions, places, previews, daily, title, renderPlaceDetail, explicitAnchors, mapMode="illustration",focusPlaceId }: { focusPlaceId?:string|null; mapMode?:"illustration"|"geographic"; explicitAnchors?:{pavilionId:string;x:number;y:number}[]; pavilions:PavilionOption[]; places:MemoryPlace[]; previews:Map<string,string>; daily:boolean; title:string; renderPlaceDetail:(id:string,onClose:()=>void)=>ReactNode }) {
  const artwork=mapMode==="geographic"?GREEN_EXPO_MAP_ART:MEMORY_MAP_ART;
  const markers = buildIllustratedMarkers(pavilions,places,previews,daily,explicitAnchors,artwork,mapMode==="geographic");
  return <section className="overflow-hidden rounded-[28px] border border-[#e6dfcf] bg-[#fffcf5] shadow-[0_16px_60px_#344c3910]">
    <div className="flex items-center justify-between gap-3 px-5 pt-5 text-xs text-[#60756b]"><span>わたしの会場マップ</span><span>● 訪問済み　○ 関連する記録</span></div>
    <VenueMapFrame focusPlaceId={focusPlaceId} markers={markers} mapAsset={artwork} badgeMarkers renderPlaceDetail={renderPlaceDetail}>
      <svg data-venue-map-source="true" viewBox={artwork.viewBox} role="img" aria-label={mapMode==="geographic"?"公開図の推定位置に対応した独自の会場マップ。現地未検証です。":"建築と庭園で思い出をつなぐイメージマップ。実会場の位置とは異なります。"} className="block h-auto w-full">
        <image href={artwork.href} width={artwork.width} height={artwork.height} preserveAspectRatio="none" />
        {mapMode==="geographic"?markers.filter(m=>m.visited).map(marker=><circle key={marker.id} cx={marker.x} cy={marker.y} r="5" fill={marker.bloom} opacity=".15"/>):null}
      </svg>
    </VenueMapFrame>
    <p className="px-5 pb-3 text-[11px] leading-5 text-[#788477]">{mapMode==="geographic"?"公開資料の掲載点から描いた推定マップです。原図画像は使っていません。色面・建築は象徴表現で、入口・園路・境界の案内には使えません。花・写真を開くと記録を見返せます。":"配置はイメージです。実会場の位置・移動案内には使えません。場所をタップすると記録が開きます。"}</p>
    <VenueMapExport memoryStyle={mapMode==="geographic"} markers={markers} asset={artwork} badgeMarkers title={title} unavailableReason={mapExportUnavailableReason(markers,places,explicitAnchors!==undefined)} />
  </section>;
}
