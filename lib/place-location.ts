import type { PhotoCoordinates } from './photo-metadata';
export type PlaceCoordinate = { pavilionId:string; latitude:number; longitude:number; uncertaintyMeters:number; basis:'surveyed'|'diagram-estimate'; source:string };
export type NearbyPlace = {pavilionId:string; distanceMeters:number; estimated:boolean};
export function rankNearbyPlaces(point:PhotoCoordinates,places:readonly PlaceCoordinate[]):NearbyPlace[]{
 const valid=(a:number,b:number)=>Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a)<=90&&Math.abs(b)<=180;
 if(!valid(point.latitude,point.longitude)||!Number.isFinite(point.accuracy)||point.accuracy<0||point.accuracy>300)return [];
 const rad=(n:number)=>n*Math.PI/180;
 return places.filter(p=>valid(p.latitude,p.longitude)&&Number.isFinite(p.uncertaintyMeters)&&p.uncertaintyMeters>=0&&p.uncertaintyMeters<=500&&Boolean(p.source))
 .map(p=>{const a=Math.sin(rad(p.latitude-point.latitude)/2)**2+Math.cos(rad(point.latitude))*Math.cos(rad(p.latitude))*Math.sin(rad(p.longitude-point.longitude)/2)**2;return {...p,distanceMeters:6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)))};})
 .filter(p=>p.distanceMeters<=Math.max(100,point.accuracy+p.uncertaintyMeters+30)).sort((a,b)=>a.distanceMeters-b.distanceMeters||a.pavilionId.localeCompare(b.pavilionId)).filter((p,index,all)=>all.findIndex(item=>item.pavilionId===p.pavilionId)===index).slice(0,3)
 .map(p=>({pavilionId:p.pavilionId,distanceMeters:Math.round(p.distanceMeters),estimated:p.basis==='diagram-estimate'}));
}
/** Explicit user-initiated location request. Abort clears the watch and ignores late results. */
export function requestCurrentPosition(geo:Pick<Geolocation,'watchPosition'|'clearWatch'>|undefined,signal:AbortSignal,timeoutMs=12000):Promise<PhotoCoordinates>{
 return new Promise((resolve,reject)=>{
  if(!geo){reject(new Error('unsupported'));return;}if(signal.aborted){reject(new Error('cancelled'));return;}
  let done=false,id:number|undefined;
  const finish=(value:PhotoCoordinates|null,error?:string)=>{if(done)return;done=true;if(id!==undefined)geo.clearWatch(id);if(timer)clearTimeout(timer);signal.removeEventListener('abort',cancel);if(value)resolve(value);else reject(new Error(error));};
  const cancel=()=>finish(null,'cancelled');signal.addEventListener('abort',cancel,{once:true});const timer=setTimeout(()=>finish(null,'timeout'),timeoutMs);
  try{id=geo.watchPosition(p=>finish({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy}),e=>finish(null,e.code===1?'denied':e.code===3?'timeout':'unavailable'),{enableHighAccuracy:true,maximumAge:0,timeout:timeoutMs});if(done)geo.clearWatch(id);}catch{finish(null,'unavailable');}
 });
}
