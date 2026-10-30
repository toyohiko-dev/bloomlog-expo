"use client";
import Image from 'next/image';
import {pointPickerLayout} from '@/lib/map-point-viewport';
import {useEffect,useRef,useState} from 'react';
import {manualMapPoint,confirmMapPoint,type MapPoint,type MapPointDraft} from '@/lib/memory-map-point';
export function MapPointPicker({initial,onConfirm,onCancel}:{initial:MapPointDraft|null;onConfirm:(point:MapPoint)=>void;onCancel:()=>void}){
 const [draft,setDraft]=useState(initial);const [zoom,setZoom]=useState(1);const dialog=useRef<HTMLDialogElement>(null);const cancel=useRef<HTMLButtonElement>(null);
 const viewport=useRef<HTMLDivElement>(null);const [size,setSize]=useState({width:0,height:0});
 const layout=pointPickerLayout(size.width,size.height,zoom,draft?.x,draft?.y);
 useEffect(()=>{const el=viewport.current;if(!el)return;const measure=()=>setSize({width:el.clientWidth,height:el.clientHeight});measure();const observer=new ResizeObserver(measure);observer.observe(el);return()=>observer.disconnect();},[]);
 useEffect(()=>{const el=viewport.current;if(!el||!size.width)return;el.scrollTo({left:layout.left,top:layout.top,behavior:'instant'});},[size.width,size.height,layout.left,layout.top]);
 useEffect(()=>{const prior=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';cancel.current?.focus();return()=>{document.body.style.overflow=overflow;prior?.focus();};},[]);
 function move(x:number,y:number){const value=manualMapPoint(x,y,draft??undefined);if(value)setDraft(value);}
 return <dialog open ref={dialog} aria-modal="true" aria-label="写真を置く場所を選ぶ" className="fixed inset-0 z-[100] m-0 flex h-dvh max-h-none w-screen max-w-none flex-col bg-[#fffcf5] p-4 text-[#234b3b] sm:p-6" onKeyDown={event=>{
 if(event.key==='Escape'){event.preventDefault();onCancel();}if(event.key==='Tab'){const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled)');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 }}>
 <header className="flex shrink-0 items-center justify-between gap-3"><h2 className="font-semibold">写真を置く場所を選ぶ</h2><button type="button" ref={cancel} className="min-h-11 rounded-full border px-4" onClick={onCancel}>選ばずに戻る</button></header>
 <p className="my-2 text-xs leading-5">写真を置きたい場所を押してください。施設名を選んでいた場合は、この場所に変更します。地図はおおよその位置です。</p>
 <div className="mb-2 flex shrink-0 gap-2"><button type="button" disabled={zoom===1} onClick={()=>setZoom(Math.max(1,zoom-.5))} className="min-h-11 rounded-full border px-4">地図を縮小</button><button type="button" disabled={zoom===3} onClick={()=>setZoom(Math.min(3,zoom+.5))} className="min-h-11 rounded-full border px-4">地図を拡大</button></div>
 <div ref={viewport} className="min-h-0 flex-1 overflow-auto rounded-2xl border bg-[#f6f0df]">
 <button type="button" aria-label="地図上で写真の位置を指定" className="relative block max-w-none text-left focus-visible:outline-4" style={{width:size.width?layout.width:"100%",height:size.height?layout.height:undefined,marginInline:"auto"}} onClick={event=>{const bounds=event.currentTarget.getBoundingClientRect();if(event.detail===0){move(draft?.x??.5,draft?.y??.5);return;}move((event.clientX-bounds.left)/bounds.width,(event.clientY-bounds.top)/bounds.height);}} onKeyDown={event=>{const step=event.shiftKey ? .002 : .01,offset={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[event.key];if(offset){event.preventDefault();move(Math.min(1,Math.max(0,(draft?.x??.5)+offset[0])),Math.min(1,Math.max(0,(draft?.y??.5)+offset[1])));}}}>
 <Image unoptimized src="/art/green-expo-places-v1.svg" width={1000} height={1250} alt="写真を置く場所を選ぶための会場マップ" className="pointer-events-none h-auto w-full max-w-none"/>
 {draft?<span aria-hidden="true" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-[#bd493b] px-3 py-2 text-lg text-white shadow-lg" style={{left:`${draft.x*100}%`,top:`${draft.y*100}%`}}>✦</span>:null}
 </button></div>
 <footer className="mt-3 shrink-0 space-y-2"><p role="status" className="text-xs">{draft?`${draft.source==='manual'?'地図で選んだ場所です。':draft.source==='photo-exif'?'写真を撮ったおおよその場所です。':'今いるおおよその場所です。'}${draft.placement==='manual'&&draft.source!=='manual'?'地図上で動かしました。':''}「ここに置く」を押してから、記録を保存してください。`:'写真を置きたい場所を地図で押してください。キーボードでは矢印キーで動かせます。'}</p><button type="button" disabled={!draft} className="min-h-11 w-full rounded-full bg-[#a94035] px-5 py-3 font-semibold text-white disabled:opacity-40" onClick={()=>{if(draft){const value=confirmMapPoint(draft,true);if(value)onConfirm(value);}}}>ここに置く</button></footer>
 </dialog>;
}
