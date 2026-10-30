"use client";
import Image from 'next/image';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
export type MemoryPhoto={id:string;url:string;title:string;date:string|null;editHref?:string;onEdit?:()=>void};
export function MemoryPhotoViewer({photos,selectedId,onSelect,onClose}:{photos:MemoryPhoto[];selectedId:string;onSelect:(id:string)=>void;onClose:()=>void}){
 const [failedId,setFailedId]=useState<string|null>(null);const [attempt,setAttempt]=useState(0);
 const dialog=useRef<HTMLDialogElement>(null);const close=useRef<HTMLButtonElement>(null);
 const index=photos.findIndex(photo=>photo.id===selectedId),photo=photos[index];
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';close.current?.focus();return()=>{document.body.style.overflow=overflow;previous?.focus();};},[]);
 if(!photo)return null;
 function move(delta:number){const target=photos[index+delta];if(target)onSelect(target.id);}
 return <dialog ref={dialog} open aria-modal="true" aria-label="思い出の写真" className="fixed inset-0 z-[100] m-0 flex h-dvh max-h-none w-screen max-w-none flex-col bg-[#153c32]/95 p-4 text-[#fffcf1] sm:p-8" onKeyDown={event=>{
  if(event.key==='Escape'){event.preventDefault();onClose();}
  if(event.key==='ArrowLeft'){event.preventDefault();move(-1);}if(event.key==='ArrowRight'){event.preventDefault();move(1);}
  if(event.key==='Tab'){const nodes=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
 }}>
 <header className="flex shrink-0 items-center justify-between gap-4"><div><p className="text-xs">{photo.date??'来場日不明'} · {index+1} / {photos.length}枚</p><h2 className="mt-1 break-words font-semibold">{photo.title}</h2></div><button ref={close} type="button" onClick={onClose} className="min-h-11 shrink-0 rounded-full border border-white/60 px-4">写真を閉じる</button></header>
 <div className="relative my-4 min-h-0 flex-1">{failedId===photo.id?<div role="alert" className="flex h-full flex-col items-center justify-center gap-4 text-center"><p>写真を読み込めませんでした。記録は残っています。接続やログイン状態を確認してください。</p><button type="button" onClick={()=>{setFailedId(null);setAttempt(value=>value+1);}} className="min-h-11 rounded-full border px-5">もう一度読み込む</button></div>:<Image key={`${photo.id}:${attempt}`} unoptimized fill sizes="100vw" src={photo.url} alt={photo.title} onError={()=>setFailedId(photo.id)} className="object-contain" />}</div>
 <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3"><button type="button" disabled={index===0} onClick={()=>move(-1)} className="min-h-11 rounded-full border px-5 disabled:opacity-40">前の写真</button>{photo.onEdit?<button type="button" className="min-h-11 rounded-full bg-[#fff8e8] px-5 py-3 font-semibold text-[#254d3e]" onClick={photo.onEdit}>この合成記録を編集</button>:photo.editHref?<Link className="min-h-11 rounded-full bg-[#fff8e8] px-5 py-3 font-semibold text-[#254d3e]" href={photo.editHref}>この記録を編集</Link>:null}<button type="button" disabled={index===photos.length-1} onClick={()=>move(1)} className="min-h-11 rounded-full border px-5 disabled:opacity-40">次の写真</button></footer>
 </dialog>;
}
