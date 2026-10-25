import data from './green-expo-source-data.json';
import bindings from './green-expo-reviewed-bindings.json';
import {greenExpoMapAnchors} from './green-expo-map';
import type {ActivityLog,PavilionOption,VisitSession} from './session-shared';
/** Public place identities + explicitly fictional records; never passed to a write action. */
export function createGeographicMemoryDemo(){
 const pavilions:PavilionOption[]=bindings.map(b=>({id:b.pavilionId,name:(()=>{const p=data.places.find(p=>p.sourceId===b.sourceId)!;const number=/-p(\d+)-(\d+)$/.exec(p.sourceId);return p.kind==='outdoor-plot'&&number?`${p.name}（屋外・図面${Number(number[1])}頁${Number(number[2])}番）`:p.name;})(),official_name:data.places.find(p=>p.sourceId===b.sourceId)!.name,country_id:null,image_path:null,area_id:null,spot_id:null,sort_order:0,aliases:[]}));
 const sessions:VisitSession[]=['2027-04-10','2027-05-12'].map((visit_date,i)=>({id:`geo-demo-day-${i}`,visit_date,event_id:data.eventId,user_id:'demo-not-a-user',title:'保存しないデモ',memo:null,created_at:'2027-05-12T00:00:00Z'}));
 const hero=bindings.find(b=>b.sourceId==='organizer-hanameguri')!.pavilionId,related=bindings.find(b=>b.sourceId==='public-ur')!.pavilionId;
 const logs:ActivityLog[]=[];
 const add=(day:number,type:string,id:string|null,title:string)=>{const p=pavilions.find(p=>p.id===id);logs.push({id:`geo-demo-record-${logs.length}`,session_id:sessions[day].id,user_id:'demo-not-a-user',event_id:data.eventId,title,memo:'架空の記録。写真もデモ用イラストです。',activity_type:type,pavilion_id:p?.id??null,pavilion:p??null,photo_path:`/art/memory-demo-${type==='food'?'food':type==='pin'?'pin':type==='pavilion_visit'?'pavilion':'flower'}.svg`,occurred_at:null,created_at:'2027-05-12T00:00:00Z',price:null,acquisition_method:type==='pin'?'purchase':null});};
 add(0,'pavilion_visit',hero,'春の展示を訪問');for(let i=0;i<4;i++)add(0,'food',hero,['春野菜のランチ','彩りのパスタ','いちごのおやつ','花のドリンク'][i]);add(1,'pavilion_visit',hero,'もう一度、同じ場所へ');for(let i=0;i<2;i++)add(1,'food',hero,['翌月のランチ','新しいデザート'][i]);add(1,'pin',related,'関連グッズの記録（訪問とは別）');
 const selected=greenExpoMapAnchors.filter((_,i)=>i%11===0).slice(0,16).filter(a=>a.pavilionId!==hero&&a.pavilionId!==related);
 selected.forEach((a,i)=>add(i%2,'pavilion_visit',a.pavilionId,`${pavilions.find(p=>p.id===a.pavilionId)!.name}の思い出`));
 const unlocated=bindings.find(b=>b.sourceId==='organizer-craft')!;add(1,'food',unlocated.pavilionId,'位置未対応でも残る思い出');add(1,'event_participation',null,'場所を後で決める記録');
 return {pavilions,sessions,logs};
}
