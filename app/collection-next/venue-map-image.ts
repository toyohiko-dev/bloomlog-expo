import {separateMemorySymbols} from '@/lib/memory-map-symbols';
import type { MapArtwork, VenueMapMarker } from "./venue-map-frame";
import { VENUE_MAP_ASSET } from "./venue-map-config";

export type UnplacedMapMemory={id:string;title:string;date:string|null;previewUrl:string|null};
const WIDTH = 1800;
const MAP_X = 44;
const MAP_Y = 166;
const MAP_WIDTH = WIDTH - MAP_X * 2;
const FONT = '"Noto Sans JP", "Yu Gothic", "Meiryo", sans-serif';

export function getMapImageSummary(markers: VenueMapMarker[]) {
  const unique = [...new Map(markers.map((marker) => [marker.id, marker])).values()];
  const visited = unique.filter((marker) => marker.visited);
  return {
    markers: unique,
    visited,
    total: unique.length,
    percentage: unique.length ? Math.round(visited.length / unique.length * 100) : 0,
  };
}

export function getMapImagePositions(markers: VenueMapMarker[], asset: MapArtwork = VENUE_MAP_ASSET) {
  const MAP_HEIGHT = MAP_WIDTH * asset.height / asset.width;
  const positions = markers.map((marker) => {
    const x = MAP_X + marker.x / asset.width * MAP_WIDTH;
    const y = MAP_Y + marker.y / asset.height * MAP_HEIGHT;
    return { marker, x, y, anchorX: x, anchorY: y, radius: marker.visited ? 35 : 9 };
  });
  if(markers.some(m=>m.paperMemory)){
    const separated=separateMemorySymbols(positions.map(p=>({id:p.marker.id,x:p.x,y:p.y,radius:p.marker.previewUrl?150:130})),{left:MAP_X,top:MAP_Y,right:MAP_X+MAP_WIDTH,bottom:MAP_Y+MAP_HEIGHT},350);
    return positions.map(p=>({...p,...separated.find(q=>q.id===p.marker.id)!,marker:p.marker}));
  }
  // Only the exported symbols move. Leader lines retain their original map
  // anchors, while closely spaced visits can each keep a readable flower.
  for (let pass = 0; pass < 24; pass++) {
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i], b = positions[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        const minimum = a.radius + b.radius + 6;
        if (distance >= minimum) continue;
        const ux = distance ? dx / distance : 1;
        const uy = distance ? dy / distance : 0;
        const shift = (minimum - distance) / 2;
        a.x -= ux * shift; a.y -= uy * shift;
        b.x += ux * shift; b.y += uy * shift;
      }
    }
    for (const point of positions) {
      point.x = Math.max(MAP_X + point.radius, Math.min(MAP_X + MAP_WIDTH - point.radius, point.x));
      point.y = Math.max(MAP_Y + point.radius, Math.min(MAP_Y + MAP_HEIGHT - point.radius, point.y));
    }
  }
  return positions;
}

function imageFromUrl(url: string, timeoutMs=15000): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => reject(new Error("image-timeout")), timeoutMs);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error("image-load")); };
    image.src = url;
  });
}

function asDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("image-read"));
    reader.readAsDataURL(blob);
  });
}

function fittedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, width: number) {
  let result = text;
  while (result.length > 1 && ctx.measureText(result).width > width) {
    result = Array.from(result).slice(0, -2).join("") + "…";
  }
  ctx.fillText(result, x, y);
}

function drawFlower(ctx: CanvasRenderingContext2D, marker: VenueMapMarker, number: number, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);
  if (!marker.visited) {
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = "#94a3b8"; ctx.stroke();
    ctx.restore(); return;
  }
  ctx.scale(0.74, 0.74);
  ctx.rotate(marker.rotation * Math.PI / 180);
  ctx.shadowColor = "#33415530"; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
  for (let petal = 0; petal < 8; petal++) {
    ctx.save(); ctx.rotate(petal * Math.PI / 4);
    const gradient = ctx.createLinearGradient(0, -46, 0, 0);
    gradient.addColorStop(0, "#ffffff"); gradient.addColorStop(0.55, marker.bloom);
    ctx.fillStyle = gradient; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, -24, 14, 23, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.rotate(-marker.rotation * Math.PI / 180);
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fillStyle = "#fff7d6"; ctx.fill(); ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = "#334155"; ctx.font = `700 22px ${FONT}`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(number), 0, 1);
  ctx.restore();
}

function drawPaperMemory(ctx:CanvasRenderingContext2D,marker:VenueMapMarker,x:number,y:number,cover:HTMLImageElement|null){
 ctx.save();ctx.translate(x,y);ctx.scale(cover?2.05:3.1,cover?2.05:3.1);
 if(cover){
  if((marker.photoCount??1)>1){ctx.save();ctx.rotate(-0.12);ctx.fillStyle='#f0c784';ctx.strokeStyle='#fffcf1';ctx.lineWidth=7;ctx.fillRect(-65,-72,132,112);ctx.strokeRect(-65,-72,132,112);ctx.restore();}
  ctx.fillStyle='#fffcf1';ctx.fillRect(-74,-75,140,122);const w=cover.naturalWidth||600,h=cover.naturalHeight||400,sw=Math.min(w,h*126/108),sh=sw*108/126;ctx.drawImage(cover,(w-sw)/2,(h-sh)/2,sw,sh,-67,-68,126,108);ctx.translate(49,40);
 }
 ctx.save();ctx.scale(0.9,0.9);
 ctx.strokeStyle='#7d9d86';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(0,34);ctx.lineTo(0,-24);ctx.moveTo(0,5);ctx.bezierCurveTo(-45,-25,-38,28,0,15);ctx.moveTo(0,-8);ctx.bezierCurveTo(38,-40,45,6,0,1);ctx.stroke();
 ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fillStyle='#fff9eb';ctx.fill();ctx.fillStyle='#335747';ctx.font=`700 18px ${FONT}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(marker.memoryCount??0),0,1);ctx.restore();
 if((marker.memoryDayCount??0)>1){ctx.fillStyle='#285c4b';ctx.fillRect(-30,-81,61,24);ctx.fillStyle='#fff9eb';ctx.font=`700 16px ${FONT}`;ctx.textAlign='center';ctx.fillText(`${marker.memoryDayCount}日`,0,-68);}
 ctx.restore();
}

/** Render the full map scene, independent of viewport zoom, panels and controls. */
export async function createVenueMapImage(source: SVGSVGElement, markers: VenueMapMarker[], options?: { asset?: MapArtwork; badgeMarkers?: boolean; title?: string; memoryStyle?:boolean;unplaced?:UnplacedMapMemory[] }): Promise<Blob> {
  const asset = options?.asset ?? VENUE_MAP_ASSET;
  const MAP_HEIGHT = MAP_WIDTH * asset.height / asset.width;
  await document.fonts.ready;
  const summary = getMapImageSummary(markers);
  const paperMode=options?.memoryStyle??markers.some(m=>m.paperMemory);
  const listed = paperMode?[]:summary.visited.slice(0, 24);
  const rows = Math.max(1, Math.ceil(listed.length / 3));
  const listY = MAP_Y + MAP_HEIGHT + 70;
  const unplaced=options?.unplaced??[];
  const appendixY=listY+rows*76+65;
  const height = Math.ceil(listY + rows * 76 + 92+(unplaced.length?100+Math.ceil(unplaced.length/3)*190:0));
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas-unavailable");

  // SVG images must be self-contained for Safari and for an untainted canvas.
  const response = await fetch(asset.href, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("map-unavailable");
  const map = source.cloneNode(true) as SVGSVGElement;
  map.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  map.setAttribute("width", String(MAP_WIDTH)); map.setAttribute("height", String(MAP_HEIGHT));
  map.removeAttribute("class"); map.removeAttribute("style");
  const base = map.querySelector("image");
  if (!base) throw new Error("map-unavailable");
  base.setAttribute("href", await asDataUrl(await response.blob()));
  const mapUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(map)], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = await imageFromUrl(mapUrl);
    ctx.fillStyle = "#f8faf5"; ctx.fillRect(0, 0, WIDTH, height);
    ctx.fillStyle = "#0f3d32"; ctx.font = `700 56px ${FONT}`;
    ctx.fillText(options?.title ?? "制覇マップ", 56, 82);
    ctx.font = `24px ${FONT}`; ctx.fillStyle = "#52675e";
    ctx.fillText(paperMode?"会場に重なる、わたしの思い出。":options?.badgeMarkers ? "思い出を、ひとつの庭に。配置はイメージです。" : "訪れた場所に、花が咲く。", 58, 128);
    ctx.textAlign = "right"; ctx.font = `700 48px ${FONT}`; ctx.fillStyle = "#0f3d32";
    ctx.fillText(paperMode?`思い出 ${summary.markers.reduce((n,m)=>n+(m.memoryCount??0),0)+unplaced.length}件`:`${summary.visited.length} / ${summary.total} 訪問済み`, WIDTH - 56, 80);
    ctx.font = `24px ${FONT}`; ctx.fillStyle = "#52675e";
    if(!paperMode)ctx.fillText(`達成率 ${summary.percentage}%`, WIDTH - 56, 125);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff"; ctx.fillRect(MAP_X, MAP_Y, MAP_WIDTH, MAP_HEIGHT);
    ctx.drawImage(image, MAP_X, MAP_Y, MAP_WIDTH, MAP_HEIGHT);
    const indexById = new Map(summary.visited.map((marker, index) => [marker.id, index + 1]));
    const positions = getMapImagePositions(paperMode?summary.markers.filter(m=>m.memoryCount):summary.markers, asset);
    for (const point of positions) {
      if (Math.hypot(point.x - point.anchorX, point.y - point.anchorY) < 5) continue;
      ctx.strokeStyle = "#52675e"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(point.anchorX, point.anchorY); ctx.lineTo(point.x, point.y); ctx.stroke();
      ctx.fillStyle = "#52675e"; ctx.beginPath(); ctx.arc(point.anchorX, point.anchorY, 3, 0, Math.PI * 2); ctx.fill();
    }
    const coverDeadline=Date.now()+45000;const covers=new Map<string,Promise<HTMLImageElement|null>>();
    async function coverFor(url:string){
      if(covers.has(url))return covers.get(url)!;
      const task=(async()=>{
        for(let attempt=0;attempt<2;attempt++){
          try{
            const remaining=coverDeadline-Date.now();if(remaining<=0)return null;
            const response=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(Math.min(6000,remaining))});
            if(!response.ok){if(attempt===0&&[408,429,500,502,503,504].includes(response.status))continue;return null;}
            const blob=await response.blob();if(blob.size>10*1024*1024)return null;
            const decodeRemaining=coverDeadline-Date.now();if(decodeRemaining<=0)return null;
            const image=await imageFromUrl(await asDataUrl(blob),Math.min(6000,decodeRemaining));
            return (image.naturalWidth||600)*(image.naturalHeight||400)<=20000000?image:null;
          }catch{if(attempt===1)return null;}
        }
        return null;
      })();
      covers.set(url,task);if(covers.size>2)covers.delete(covers.keys().next().value!);return task;
    }
    for (let index=0;index<positions.length;index++) {
      // Two photos at a time: a slow response must not prevent the next photo from starting.
      // Keep only this batch decoded, retaining the existing memory and total wait bounds.
      if(paperMode&&index%2===0)await Promise.all(positions.slice(index,index+2).map(p=>p.marker.previewUrl?coverFor(p.marker.previewUrl):null));
      const {marker,x,y}=positions[index];
      if(paperMode){const cover=marker.previewUrl?await coverFor(marker.previewUrl):null;if(marker.previewUrl&&!cover)throw new Error("photo-unavailable");drawPaperMemory(ctx,marker,x,y,cover);continue;}
      if (options?.badgeMarkers) {
        ctx.beginPath(); ctx.arc(x, y, marker.memoryCount ? 25 : 9, 0, Math.PI * 2);
        ctx.fillStyle = marker.visited ? "#226354" : "#fff8ed"; ctx.fill();
        ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 4; ctx.stroke();
        if (marker.memoryCount) { ctx.fillStyle = marker.visited ? "#ffffff" : "#875b42"; ctx.font = `700 22px ${FONT}`; ctx.textAlign = "center"; ctx.fillText(String(marker.memoryCount), x, y + 8); ctx.textAlign = "left"; }
      } else drawFlower(ctx, marker, indexById.get(marker.id) ?? 0, x, y);
    }

    ctx.fillStyle = "#0f3d32"; ctx.font = `700 28px ${FONT}`;
    if(!paperMode)ctx.fillText("訪れたパビリオン", 56, listY);
    const columnWidth = (WIDTH - 112) / 3;
    listed.forEach((marker, index) => {
      const x = 56 + index % 3 * columnWidth;
      const y = listY + 48 + Math.floor(index / 3) * 76;
      ctx.fillStyle = marker.bloom; ctx.beginPath(); ctx.arc(x + 16, y - 8, 16, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffffff"; ctx.font = `700 18px ${FONT}`; ctx.textAlign = "center";
      ctx.fillText(String(index + 1), x + 16, y - 2); ctx.textAlign = "left";
      ctx.fillStyle = "#243b32"; ctx.font = `700 24px ${FONT}`;
      fittedText(ctx, marker.name, x + 44, y, columnWidth - 65);
      ctx.fillStyle = "#64756d"; ctx.font = `19px ${FONT}`;
      fittedText(ctx, `${marker.areaName} · ${marker.visitCount}回`, x + 44, y + 28, columnWidth - 65);
    });
    if (!paperMode && !listed.length) {
      ctx.font = `24px ${FONT}`; ctx.fillStyle = "#64756d";
      ctx.fillText("最初の訪問を記録すると、地図に花が咲きます。", 56, listY + 50);
    }
    if(unplaced.length){
      ctx.textAlign='left';ctx.font=`700 28px ${FONT}`;ctx.fillStyle='#234b3b';
      for(let index=0;index<unplaced.length;index++){
        if(index%2===0)await Promise.all(unplaced.slice(index,index+2).map(entry=>entry.previewUrl?coverFor(entry.previewUrl):null));
        const entry=unplaced[index],x=56+(index%3)*columnWidth,y=appendixY+25+Math.floor(index/3)*190;
        const photo=entry.previewUrl?await coverFor(entry.previewUrl):null;
        if(photo){const width=photo.naturalWidth||600,height=photo.naturalHeight||400,scale=Math.min((columnWidth-30)/width,100/height);ctx.drawImage(photo,x,y,width*scale,height*scale);}else if(entry.previewUrl){throw new Error("photo-unavailable");}
        ctx.textAlign='left';ctx.fillStyle='#234b3b';ctx.font=`700 22px ${FONT}`;fittedText(ctx,entry.title,x,y+128,columnWidth-30);
        ctx.fillStyle='#52675e';ctx.font=`18px ${FONT}`;ctx.fillText(entry.date??'日付なし',x,y+157);
      }
    }
    ctx.font = `21px ${FONT}`; ctx.fillStyle = "#64756d";
    const date = new Intl.DateTimeFormat("ja-JP", { dateStyle: "medium", timeZone: "Asia/Tokyo" }).format(new Date());
    ctx.fillText(`${date} 作成${summary.visited.length > 24 ? ` · 一覧は24件まで表示（ほか${summary.visited.length - 24}件）` : ""}`, 56, height - 35);
    ctx.textAlign = "right"; ctx.font = `700 26px ${FONT}`; ctx.fillStyle = "#0f3d32";
    ctx.fillText("BloomLog", WIDTH - 56, height - 35);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("png-export")), "image/png");
    });
  } finally {
    URL.revokeObjectURL(mapUrl);
  }
}
