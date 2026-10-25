import type {PlaceCoordinate} from './place-location';

export type RegistryEvent = { id:string; name:string; sourceNamespace:string };
export type SourcePlace = {
  eventId:string; sourceId:string; pavilionId:string|null;
  identityReviewed:boolean; identityEvidence:string; facilityKey:string; completionEligible?:boolean;
  coordinate?:{latitude:number;longitude:number;uncertaintyMeters:number;basis:'surveyed'|'diagram-estimate';source:string;productionApproved:boolean;extrapolated:boolean;conflict:boolean;isEntrance:boolean};
};
export type IllustrationAnchor = {eventId:string;pavilionId:string;artworkId:string;x:number;y:number;reviewed:boolean};
export type PlaceRegistry = {events:readonly RegistryEvent[];places:readonly SourcePlace[];anchors:readonly IllustrationAnchor[];pendingPavilionIds?:readonly string[]};
export type RegistryIssue = {code:string;key:string};
const uuid=(v:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const validEvent=(id:string)=>typeof id==="string"&&id.trim().length>0&&id.length<=200;
const sourceKey=(p:SourcePlace)=>JSON.stringify([p.eventId,p.sourceId]);
function repeated<T>(rows:readonly T[],key:(row:T)=>string){const counts=new Map<string,number>();for(const row of rows)counts.set(key(row),(counts.get(key(row))??0)+1);return new Set([...counts].filter(([,n])=>n>1).map(([k])=>k));}
function validCoordinate(c:SourcePlace['coordinate']):boolean {
 if(!c||!Number.isFinite(c.latitude)||Math.abs(c.latitude)>90||!Number.isFinite(c.longitude)||Math.abs(c.longitude)>180||!Number.isFinite(c.uncertaintyMeters)||c.uncertaintyMeters<0||c.uncertaintyMeters>500||typeof c.source!=="string"||!c.source.trim())return false;
 if(!['surveyed','diagram-estimate'].includes(c.basis)||typeof c.productionApproved!=="boolean"||typeof c.extrapolated!=="boolean"||typeof c.conflict!=="boolean"||typeof c.isEntrance!=="boolean")return false;
 return c.basis!=="diagram-estimate"||(c.productionApproved===false&&c.isEntrance===false&&c.uncertaintyMeters>0);
}
export function inspectPlaceRegistry(registry:PlaceRegistry,existingPavilionIds:ReadonlySet<string>,existingEventIds?:ReadonlySet<string>):RegistryIssue[]{
 const issues:RegistryIssue[]=[];const events=new Set(registry.events.map(e=>e.id));const sources=repeated(registry.places,sourceKey);
 for(const event of registry.events){if(!validEvent(event.id)||!event.name||!event.sourceNamespace)issues.push({code:'invalid-event',key:event.id});if(existingEventIds&&!existingEventIds.has(event.id))issues.push({code:'event-not-in-database',key:event.id});}
 for(const key of repeated(registry.events,e=>e.id))issues.push({code:'duplicate-event',key});
 for(const place of registry.places){const key=sourceKey(place);if(!events.has(place.eventId))issues.push({code:'unknown-event',key});if(!place.sourceId||sources.has(key))issues.push({code:'duplicate-or-empty-source',key});
  if(!place.identityReviewed||!place.identityEvidence||!place.facilityKey||!place.pavilionId){issues.push({code:'identity-unresolved',key});continue;}
  if(!uuid(place.pavilionId)||!existingPavilionIds.has(place.pavilionId))issues.push({code:'pavilion-not-in-database',key});
  if(registry.places.some(other=>other!==place&&other.eventId===place.eventId&&other.pavilionId===place.pavilionId&&other.facilityKey!==place.facilityKey))issues.push({code:'conflicting-facility-identity',key});
  const c=place.coordinate;if(c&&!validCoordinate(c))issues.push({code:'invalid-coordinate',key});
 }
 for(const anchor of registry.anchors){if(!events.has(anchor.eventId)||!existingPavilionIds.has(anchor.pavilionId)||!anchor.artworkId||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y)||anchor.x<0||anchor.x>1||anchor.y<0||anchor.y>1)issues.push({code:'invalid-illustration-anchor',key:JSON.stringify([anchor.eventId,anchor.pavilionId])});}
 for(const key of repeated(registry.anchors,a=>JSON.stringify([a.eventId,a.pavilionId,a.artworkId])))issues.push({code:'duplicate-anchor',key});
 return issues;
}
export function reviewedBindings(registry:PlaceRegistry){
 const duplicateEvents=repeated(registry.events,e=>e.id),duplicates=repeated(registry.places,sourceKey);
 return registry.places.filter(p=>registry.events.some(e=>e.id===p.eventId&&validEvent(e.id)&&e.sourceNamespace&&!duplicateEvents.has(e.id))&&p.identityReviewed===true&&Boolean(p.identityEvidence)&&Boolean(p.facilityKey)&&Boolean(p.sourceId)&&p.pavilionId&&uuid(p.pavilionId)&&!duplicates.has(sourceKey(p))&&!registry.places.some(other=>other!==p&&other.eventId===p.eventId&&other.pavilionId===p.pavilionId&&other.facilityKey!==p.facilityKey));
}
export function isRegisteredEvent(registry:PlaceRegistry,eventId:string|null){return eventId!==null&&registry.events.some(e=>e.id===eventId);}
/** Unbound legacy masters stay selectable; availability is NOT an event/source assignment. */
export function isLegacyPavilion(registry:PlaceRegistry,pavilionId:string){return !registry.pendingPavilionIds?.includes(pavilionId)&&!registry.places.some(p=>p.pavilionId===pavilionId);}
export function canUsePavilionInEvent(registry:PlaceRegistry,eventId:string|null,pavilionId:string){
 const linked=reviewedBindings(registry).filter(p=>p.pavilionId===pavilionId);
 if(linked.length)return linked.some(p=>p.eventId===eventId);
 return isLegacyPavilion(registry,pavilionId);
}
/** Completion units require separate approval; published markers never opt in implicitly. */
export function progressPavilions<T extends {id:string}>(pavilions:T[],eventId:string|null,registry:PlaceRegistry){
 if(!isRegisteredEvent(registry,eventId))return eventId===null?pavilions.filter(p=>isLegacyPavilion(registry,p.id)):[];
 const eligible=new Set(reviewedBindings(registry).filter(p=>p.eventId===eventId&&p.completionEligible===true).map(p=>p.pavilionId));
 return pavilions.filter(p=>eligible.has(p.id));
}
export function summarizePavilionProgress<T extends {id:string},L extends {session_id:string;pavilion_id:string|null;activity_type:string|null},S extends {id:string;event_id:string|null}>(pavilions:T[],logs:L[],sessions:S[],eventId:string|null,registry:PlaceRegistry){
 const scoped=scopeMemoryRecords(logs,sessions,eventId,registry);
 const units=progressPavilions(pavilions,eventId,registry);
 const visited=new Set(scoped.logs.filter(l=>l.activity_type==='pavilion_visit'&&l.pavilion_id).map(l=>l.pavilion_id!));
 const completed=units.filter(p=>visited.has(p.id)).length;
 return {totalPavilions:units.length,visitedPavilions:visited.size,completedPavilions:completed,unverifiedVisitedPavilions:visited.size-completed,unvisitedPavilions:units.filter(p=>!visited.has(p.id)),completionRate:units.length?completed/units.length:null};
}
export function scopedPavilions<T extends {id:string}>(pavilions:T[],eventId:string|null,registry:PlaceRegistry){return pavilions.filter(p=>canUsePavilionInEvent(registry,eventId,p.id));}
export function coordinatesForEvent(registry:PlaceRegistry,eventId:string|null,existingPavilionIds:ReadonlySet<string>):PlaceCoordinate[]{
 return reviewedBindings(registry).filter(p=>p.eventId===eventId&&p.pavilionId&&existingPavilionIds.has(p.pavilionId)&&p.coordinate&&!p.coordinate.conflict&&!p.coordinate.extrapolated).flatMap(p=>{
  const c=p.coordinate!;if(!validCoordinate(c))return [];
  return [{pavilionId:p.pavilionId!,latitude:c.latitude,longitude:c.longitude,uncertaintyMeters:c.uncertaintyMeters,basis:c.basis,source:c.source,sourceId:p.sourceId,eventId:p.eventId,productionApproved:c.productionApproved,isEntrance:c.isEntrance}];
 });
}
export function anchorsForEvent(registry:PlaceRegistry,eventId:string|null,artworkId:string,existingPavilionIds:ReadonlySet<string>){
 const allowed=new Set(reviewedBindings(registry).filter(p=>p.eventId===eventId).map(p=>p.pavilionId));const duplicates=repeated(registry.anchors,a=>JSON.stringify([a.eventId,a.pavilionId,a.artworkId]));
 return registry.anchors.filter(a=>a.reviewed===true&&a.eventId===eventId&&a.artworkId===artworkId&&allowed.has(a.pavilionId)&&existingPavilionIds.has(a.pavilionId)&&!duplicates.has(JSON.stringify([a.eventId,a.pavilionId,a.artworkId]))&&Number.isFinite(a.x)&&a.x>=0&&a.x<=1&&Number.isFinite(a.y)&&a.y>=0&&a.y<=1);
}
/** Unclassified is a view, never an assignment or update to saved records. */
export function scopeMemoryRecords<L extends {session_id:string;pavilion_id?:string|null},S extends {id:string;event_id:string|null}>(logs:L[],sessions:S[],eventId:string|null,registry:PlaceRegistry){
 const byId=new Map(sessions.map(day=>[day.id,day]));
 const selectedLogs=logs.filter(log=>{const day=byId.get(log.session_id);if(eventId!==null)return day?.event_id===eventId;
  return !day||!isRegisteredEvent(registry,day.event_id)||Boolean(log.pavilion_id&&isLegacyPavilion(registry,log.pavilion_id));
 });
 const selectedIds=new Set(selectedLogs.map(log=>log.session_id));
 const selectedDays=sessions.filter(day=>eventId!==null?day.event_id===eventId:!isRegisteredEvent(registry,day.event_id)||selectedIds.has(day.id));
 return {sessions:selectedDays,logs:selectedLogs};
}
