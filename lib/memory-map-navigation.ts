export const GREEN_EXPO_EVENT_ID='e60f2360-8147-4112-969a-00954596ceb6';
export function resolveMemoryMapEvent(requested:string|undefined,events:{id:string}[]){
 if(requested==='unclassified')return null;
 if(events.some(event=>event.id===requested))return requested!;
 return events.some(event=>event.id===GREEN_EXPO_EVENT_ID)?GREEN_EXPO_EVENT_ID:null;
}
/** Fixed same-origin destination; never accepts a caller-supplied URL. */
export function memoryMapReturnHref(eventId:string|null,placeId:string|null,date:string|null,recordId:string|null=null){const q=new URLSearchParams();q.set('event',eventId??'unclassified');if(placeId)q.set('place',placeId);if(date&&/^\d{4}-\d{2}-\d{2}$/.test(date))q.set('day',date);return `/collection-next${q.size?'?'+q.toString():''}${recordId?'#memory-entry-'+encodeURIComponent(recordId):!placeId?'#unplaced-memories':''}`;}

/** Navigation opens the map, while save-return links can target a deferred record below it. */
export function memoryMapHref(eventId:string|null,date:string|null=null){return memoryMapReturnHref(eventId,null,date).split('#')[0];}
export function memoryMapPhotoEntryHref(sessions:{id:string;visit_date:string}[],eventId:string|null,date:string|null){
 const day=sessions.find(day=>date?day.visit_date===date:true);
 if(day)return `/sessions/${encodeURIComponent(day.id)}/activities/new?return=map#photo`;
 const query=new URLSearchParams();if(eventId)query.set('event',eventId);if(date&&/^\d{4}-\d{2}-\d{2}$/.test(date))query.set('visitDate',date);
 return `/sessions/new${query.size?'?'+query.toString():''}`;
}
