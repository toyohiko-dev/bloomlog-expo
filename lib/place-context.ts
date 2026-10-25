import type {greenExpoResearch} from './green-expo-research';
type Catalog=typeof greenExpoResearch;
export type PlaceContext={version:1;event_id:string;source_catalog_version:string;source_place_id:string;subplace_source_id:string|null;indoor_occurrence_id:string|null};
type Result={ok:true;value:PlaceContext|null}|{ok:false;error:string};
const keys=['version','event_id','source_catalog_version','source_place_id','subplace_source_id','indoor_occurrence_id'];
export function decodePlaceContext(input:unknown):Result{
 if(input===null||input===undefined||input==='')return {ok:true,value:null};
 try{
  const text=typeof input==='string'?input:JSON.stringify(input);if(text.length>2048)return {ok:false,error:'場所の詳細が長すぎます。'};
  const v:unknown=JSON.parse(text);if(!v||typeof v!=='object'||Array.isArray(v))return {ok:false,error:'場所の詳細を選び直してください。'};
  const p=v as Record<string,unknown>;
  if(Object.keys(p).length!==keys.length||keys.some(k=>!Object.hasOwn(p,k))||Object.keys(p).some(k=>!keys.includes(k))||p.version!==1)return {ok:false,error:'場所の詳細の形式が未対応です。'};
  const id=(x:unknown)=>typeof x==='string'&&x.length>0&&x.length<=200&&/^[a-zA-Z0-9._:-]+$/.test(x);
  if(!id(p.event_id)||!id(p.source_place_id)||typeof p.source_catalog_version!=='string'||!/^[a-f0-9]{64}$/.test(p.source_catalog_version)||!(p.subplace_source_id===null||id(p.subplace_source_id))||!(p.indoor_occurrence_id===null||id(p.indoor_occurrence_id)))return {ok:false,error:'場所の詳細を選び直してください。'};
  return {ok:true,value:p as PlaceContext};
 }catch{return {ok:false,error:'場所の詳細を読み取れません。'};}
}
export function validatePlaceContext(input:unknown,{catalog,eventId,visitDate,pavilionId,bindings}:{catalog:Catalog;eventId:string|null;visitDate:string;pavilionId:string|null;bindings:ReadonlyMap<string,string>}):Result{
 const parsed=decodePlaceContext(input);if(!parsed.ok||!parsed.value)return parsed;
 const v=parsed.value;
 if(v.event_id!==eventId||eventId!==catalog.eventId||v.source_catalog_version!==catalog.packetSha256||!pavilionId||bindings.get(v.source_place_id)!==pavilionId)return {ok:false,error:'この来場日・場所に対応する詳細を選び直してください。'};
 const parent=catalog.places.find(p=>p.sourceId===v.source_place_id);
 if(!parent||parent.parentId||parent.coordinate?.conflict||['service-baby','service-accessibility'].includes(parent.sourceId))return {ok:false,error:'この場所は正式な記録先として未対応です。'};
 if(v.subplace_source_id&&!catalog.places.some(p=>p.sourceId===v.subplace_source_id&&p.parentId===parent.sourceId))return {ok:false,error:'施設内の場所が一致しません。'};
 if(v.indoor_occurrence_id){
  const occurrence=catalog.occurrences.find(o=>o.id===v.indoor_occurrence_id&&o.facility_id===parent.sourceId);
  const date=new Date(`${visitDate}T00:00:00Z`);
  if(!occurrence||v.subplace_source_id||!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)||!Number.isFinite(date.valueOf())||date.toISOString().slice(0,10)!==visitDate)return {ok:false,error:'出展回と来場日を確認してください。'};
  const period=catalog.periods.find(p=>p.id===occurrence.period_id);const start=occurrence.precise_start_date??period?.start_date,end=occurrence.precise_end_date_inclusive??period?.end_date_inclusive;
  if(!start||!end||visitDate<start||visitDate>end)return {ok:false,error:'選んだ出展回はこの来場日の期間外です。'};
 }
 return parsed;
}
export function makePlaceContext(catalog:Catalog,sourcePlaceId:string,subplaceId:string|null=null,occurrenceId:string|null=null):PlaceContext{return {version:1,event_id:catalog.eventId,source_catalog_version:catalog.packetSha256,source_place_id:sourcePlaceId,subplace_source_id:subplaceId,indoor_occurrence_id:occurrenceId};}
export function describePlaceContext(input:unknown,catalog:Catalog):string{
 const parsed=decodePlaceContext(input);if(!parsed.ok||!parsed.value)return '';const v=parsed.value;
 if(v.source_catalog_version!==catalog.packetSha256)return '以前の資料に基づく場所の詳細';
 const parent=catalog.places.find(p=>p.sourceId===v.source_place_id);if(!parent)return '資料の対応が未確認の場所';
 const child=v.subplace_source_id?catalog.places.find(p=>p.sourceId===v.subplace_source_id&&p.parentId===parent.sourceId):null;
 const occurrence=v.indoor_occurrence_id?catalog.occurrences.find(o=>o.id===v.indoor_occurrence_id&&o.facility_id===parent.sourceId):null;
 return [parent.name,child?.name,occurrence?.exhibitor_name_raw,occurrence?.event_space_7_day_note?'期間内の7日間・正確な日程未確定':null].filter(Boolean).join(' / ');
}
