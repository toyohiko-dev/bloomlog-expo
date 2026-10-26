"use client";
import {useEffect,useRef,useState} from 'react';
import {ActivityLogForm} from '@/app/sessions/[id]/activity-log-form';
import {MemoryMapExplorer} from './memory-map-explorer';
import {greenExpoMapAnchors} from '@/lib/green-expo-map';
import {MAP_POINT_FRAME,validateMapPoint,type MapPoint} from '@/lib/memory-map-point';
import {assertPreparedActivityPhoto} from '@/lib/activity-photo-upload';
import type {ActivityLog,VisitSession,PavilionOption} from '@/lib/session-shared';
import type {ActivityType} from '@/lib/activity-types';
import type {ActivityLogFormState} from '@/lib/activity-log-form-state';
const sessions:VisitSession[]=['2027-04-10','2027-05-12'].map((visit_date,i)=>({id:'point-fixture-day-'+i,user_id:'point-fixture-owner',event_id:MAP_POINT_FRAME.eventId,visit_date,title:'合成試験',memo:null,created_at:'2027-04-10T00:00:00Z'}));
type RecordPhoto=ActivityLog&{photoUrl:string|null};
/** Explicit local browser fixture: no server action, Storage upload or database write is called. */
export function MapPointFlowFixture({pavilions}:{pavilions:PavilionOption[]}){
 const [records,setRecords]=useState<RecordPhoto[]>([]),[editing,setEditing]=useState<string|null|false>(null),[file,setFile]=useState<File|null>(null),[failNext,setFailNext]=useState(true),[focus,setFocus]=useState<string|undefined>(),[revision,setRevision]=useState(0);const urls=useRef<string[]>([]);const savedRecord=useRef<RecordPhoto|null>(null);
 useEffect(()=>{const ownedUrls=urls.current;let active=true;const canvas=document.createElement('canvas');canvas.width=600;canvas.height=800;const c=canvas.getContext('2d');if(c){c.fillStyle='#f8dfad';c.fillRect(0,0,600,800);c.fillStyle='#b54346';c.fillRect(55,80,490,280);c.fillStyle='#285e4a';c.fillRect(55,400,490,280);c.fillStyle='#fff9ed';c.font='bold 46px sans-serif';c.fillText('SYNTHETIC',115,235);c.fillText('PARADE',170,555);canvas.toBlob(blob=>{if(active&&blob)setFile(new File([blob],'synthetic-parade.png',{type:'image/png'}));},'image/png');}return()=>{active=false;for(const url of ownedUrls)URL.revokeObjectURL(url);};},[]);
 const places=pavilions.filter(p=>p.id==='6d66171a-a4d3-5395-bdc0-e1b4121e9b60');
 const entry=typeof editing==='string'?records.find(r=>r.id===editing):null;
 async function submit(data:FormData,mode:'create'|'edit'):Promise<ActivityLogFormState>{
  await new Promise(resolve=>setTimeout(resolve,300));
  const text=(key:string)=>String(data.get(key)??'');const session=sessions.find(s=>s.id===text('sessionId'));const pavilionId=text('pavilionId')||null;
  const context={eventId:session?.event_id??null,pavilionId,activityType:text('activityType')};const point=validateMapPoint(text('mapPoint'),context);
  const error=(message:string):ActivityLogFormState=>({status:'error',message,fieldErrors:{}});
  if(!session||!point.ok||!text('title')||context.activityType==='pavilion_visit'&&!pavilionId)return error('合成試験：日付・種類・位置を確認してください。入力は保持しています。');
  const photo=data.get('photo');if(photo instanceof File&&photo.size)await assertPreparedActivityPhoto(photo);
  if(failNext){setFailNext(false);return error('合成試験：写真送信の失敗を再現しました。写真・位置・入力を保持しています。再試行できます。');}
  const id=mode==='edit'?text('logId'):text('saveAttemptId');const old=records.find(r=>r.id===id);
  let photoUrl=old?.photoUrl??null;if(photo instanceof File&&photo.size){photoUrl=URL.createObjectURL(photo);urls.current.push(photoUrl);}
  const pavilion=places.find(p=>p.id===pavilionId)??null;
  const record:RecordPhoto={id,user_id:'point-fixture-owner',event_id:MAP_POINT_FRAME.eventId,session_id:session.id,title:text('title'),memo:text('memo'),activity_type:text('activityType'),price:Number(text('price'))||null,acquisition_method:text('acquisitionMethod')||null,pavilion_id:pavilionId,pavilion,photo_path:photoUrl,photoUrl,map_point:point.value,created_at:old?.created_at??new Date().toISOString(),occurred_at:null};
  savedRecord.current=record;setRecords(current=>mode==='edit'?current.map(r=>r.id===id?record:r):current.some(r=>r.id===id)?current:[...current,record]);return {status:'success',message:'合成記録を端末内だけに保存しました。',fieldErrors:{}};
 }
 return <main className="mx-auto max-w-4xl space-y-5 bg-[#f8f5ec] p-4"><h1 className="text-xl font-bold text-[#234b3b]">写真→位置→保存→地図→編集の合成試験</h1><p role="status" className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">本番DB・Storageへ送信しません。写真はこの画面で生成し、記録は再読込で消えます。端末GPS・カメラは使用しません。</p><div className="flex flex-wrap gap-3"><button type="button" onClick={()=>setEditing(null)} className="min-h-11 rounded-full border bg-white px-4">合成記録を追加</button><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={failNext} onChange={e=>setFailNext(e.target.checked)}/>次の保存を通信失敗にする</label><p role="status" className="self-center text-sm">端末内の記録 {records.length}件</p></div>
 {editing!==false?<section aria-label="合成記録エディター"><button type="button" className="mb-3 min-h-11 rounded-full border px-4" onClick={()=>setEditing(false)}>入力を閉じて地図へ</button><ActivityLogForm key={editing??'new'} sessionId={entry?.session_id??sessions[0].id} visitDate={sessions.find(s=>s.id===entry?.session_id)?.visit_date??sessions[0].visit_date} visitEventId={MAP_POINT_FRAME.eventId} visitSessions={sessions} pavilions={places} mode={entry?'edit':'create'} logId={entry?.id} mapPointAvailable initialMapPoint={entry?.map_point as MapPoint|null??null} initialActivityType={(entry?.activity_type??'event_participation') as ActivityType} initialTitle={entry?.title??'合成パレード'} initialMemo={entry?.memo??''} initialPavilionId={entry?.pavilion_id??null} draftOwnerId="isolated-point-fixture" fixtureAdapter={{photo:file,submit,onSaved:id=>{const savedPoint=savedRecord.current?.map_point;setFocus(savedPoint&&id?'point:'+id:undefined);setRevision(n=>n+1);setEditing(false);}}}/></section>:null}
 <MemoryMapExplorer key={revision} mapPointAvailable onEditRecord={id=>setEditing(id)} eventId={MAP_POINT_FRAME.eventId} demo mapMode="geographic" initialPlaceId={focus} initialDate={focus? sessions.find(s=>s.id===records.find(r=>'point:'+r.id===focus)?.session_id)?.visit_date:undefined} scopeLabel="保存なしの操作試験・施設の訪問数とは別の写真位置" logs={records} sessions={sessions} pavilions={places} areas={[]} explicitAnchors={greenExpoMapAnchors.filter(a=>places.some(p=>p.id===a.pavilionId))}/>
 </main>;
}
