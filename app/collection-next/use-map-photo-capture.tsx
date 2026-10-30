"use client";
import {useEffect,useRef,useState} from 'react';
import {ActivityLogForm} from '@/app/sessions/[id]/activity-log-form';
import {manualMapPoint,confirmMapPoint,type MapPoint} from '@/lib/memory-map-point';
import type {PavilionOption,VisitSession} from '@/lib/session-shared';

export type MapCaptureFixture=NonNullable<Parameters<typeof ActivityLogForm>[0]['fixtureAdapter']>;

/** Native capture is opened only in the user's map tap/camera-button gesture. */
export function useMapPhotoCapture({enabled,sessions,pavilions,date,fixtureAdapter}:{fixtureAdapter?:MapCaptureFixture;enabled:boolean;sessions:VisitSession[];pavilions:PavilionOption[];date:string|null}){
 const camera=useRef<HTMLInputElement>(null),dialog=useRef<HTMLDivElement>(null);
 const [point,setPoint]=useState<MapPoint|null>(null),[photo,setPhoto]=useState<File|null>(null),[editor,setEditor]=useState(false);
 const [recordingDay,setRecordingDay]=useState('');const [cameraNotice,setCameraNotice]=useState('');
 const [started,setStarted]=useState(false);const captureLock=useRef(false);
 useEffect(()=>{if(!editor)return;const oldOverflow=document.body.style.overflow,oldFocus=document.activeElement as HTMLElement|null;document.body.style.overflow='hidden';dialog.current?.focus();return()=>{document.body.style.overflow=oldOverflow;oldFocus?.focus();};},[editor]);
 function openCamera(){try{camera.current?.click();setCameraNotice('');}catch{captureLock.current=false;setCameraNotice('カメラを開けませんでした。位置は保持しています。もう一度撮るか、写真をあとで指定できます。');}}
 function begin(x:number,y:number){
  if(!enabled||captureLock.current||fixtureAdapter&&!fixtureAdapter.photo)return;const draft=manualMapPoint(x,y);const selected=draft?confirmMapPoint(draft,true):null;if(!selected)return;
  captureLock.current=true;setRecordingDay(sessions.find(s=>s.visit_date===date)?.id??'');setPoint(selected);if(fixtureAdapter?.photo){setPhoto(fixtureAdapter.photo);setStarted(true);setEditor(true);}else openCamera();
 }
 function finishCapture(){captureLock.current=false;setEditor(false);setStarted(false);setPhoto(null);setPoint(null);setCameraNotice('');}
 useEffect(()=>{const input=camera.current;if(!input)return;const cancel=()=>{if(!started)captureLock.current=false;};input.addEventListener('cancel',cancel);return()=>input.removeEventListener('cancel',cancel);},[started]);
 const content=<>
  <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label="地図で指定した場所で撮影" className="hidden" onChange={e=>{const selected=e.target.files?.[0];if(selected&&point&&enabled){setPhoto(selected);setStarted(true);setEditor(true);}else if(!started){captureLock.current=false;}e.target.value='';}}/>
  {point?<div role="status" className="rounded-2xl border border-[#b8cbb1] bg-[#fffaf0] p-4 text-sm text-[#234b3b]">
   <p>タップした写真の位置を保持しています。撮影を取り消しても、ここから続けられます。</p>{cameraNotice?<p className="mt-2" role="alert">{cameraNotice}</p>:null}
   <div className="mt-3 flex flex-wrap gap-2">
    {started?<button type="button" className="min-h-11 rounded-full border px-4" onClick={()=>setEditor(true)}>撮影中の記録に戻る</button>:<><button type="button" className="min-h-11 rounded-full bg-[#a94035] px-4 text-white" onClick={openCamera}>この位置で写真を撮る</button><button type="button" className="min-h-11 rounded-full border px-4" onClick={()=>{setStarted(true);setEditor(true);}}>写真はあとで記録する</button><button type="button" className="min-h-11 rounded-full border px-4" onClick={()=>{captureLock.current=false;setPoint(null);}}>位置指定をやめる</button></>}
   </div>
  </div>:enabled?<p className="text-sm text-[#355744]">{fixtureAdapter?"地図をタップして合成写真の記録を試せます（撮影・送信なし）。":"地図の空いている場所をタップすると、その位置で写真を撮れます。花や写真を押すと記録が開きます。"}</p>:null}
  {point&&started?<div ref={dialog} hidden={!editor} role={editor?'dialog':undefined} aria-modal={editor?true:undefined} aria-label="タップした位置で写真を記録" tabIndex={-1} className="fixed inset-0 z-[90] overflow-y-auto bg-[#f8f5ec] p-3 sm:p-6" onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();setEditor(false);}if(e.key==='Tab'){const all=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled):not([type=hidden]),select:not(:disabled),textarea:not(:disabled),a[href],summary');const nodes=all?Array.from(all).filter(el=>el.checkVisibility()):[];const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}}>
   <div className="mx-auto max-w-3xl"><header className="sticky top-0 z-40 mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#fffcf5] p-3"><h2 className="font-bold text-[#234b3b]">この位置の写真を記録</h2><button type="button" className="min-h-11 rounded-full border px-4" onClick={()=>setEditor(false)}>地図に戻る・入力を保持</button></header>
   {!sessions.length?<p className="mb-4 text-sm">保存する前に来場日の登録が必要です。写真と位置はこの画面を閉じるまで保持します。</p>:null}
   <ActivityLogForm photoEntry returnMapDate={date} onSaveComplete={finishCapture} fixtureAdapter={fixtureAdapter} sessionId={recordingDay} visitDate={sessions.find(s=>s.id===recordingDay)?.visit_date} visitEventId={point.event_id} visitSessions={sessions} pavilions={pavilions} initialActivityType="event_participation" initialTitle="写真の思い出" initialMapPoint={point} initialPhoto={photo} returnToMap submitLabel="写真の思い出を保存"/>
   </div>
  </div>:null}
 </>;
 return {beginCapture:enabled&&!started?begin:undefined,content};
}
