import raw from './green-expo-source-data.json';
import type {PhotoCoordinates} from './photo-metadata';

/** Published drawing research is not a database binding or a surveyed entrance. */
export const greenExpoResearch = raw;
export type ResearchPlace = (typeof raw.places)[number];
export function researchPlacesForEvent(eventId:string|null):ResearchPlace[]{
 return eventId===raw.eventId?raw.places:[];
}
export function nearbyResearchPlaces(point:PhotoCoordinates,eventId:string|null){
 if(!Number.isFinite(point.latitude)||Math.abs(point.latitude)>90||!Number.isFinite(point.longitude)||Math.abs(point.longitude)>180||!Number.isFinite(point.accuracy)||point.accuracy<0||point.accuracy>150)return [];
 const rad=(n:number)=>n*Math.PI/180;
 // Discovery window only, NEVER an error radius or a claim of measured accuracy.
 const discoveryWindowMeters=250;
 return researchPlacesForEvent(eventId).filter(p=>p.gpsEnabled&&p.coordinate&&!p.coordinate.conflict&&p.productionApproved===false&&p.automaticAssignmentAllowed===false).flatMap(place=>{
  const c=place.coordinate!;
  if(!Number.isFinite(c.latitude)||Math.abs(c.latitude)>90||!Number.isFinite(c.longitude)||Math.abs(c.longitude)>180)return [];
  const a=Math.sin(rad(c.latitude-point.latitude)/2)**2+Math.cos(rad(point.latitude))*Math.cos(rad(c.latitude))*Math.sin(rad(c.longitude-point.longitude)/2)**2;
  const distanceMeters=6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(Math.max(0,1-a)));
  return distanceMeters<=discoveryWindowMeters?[{place,distanceMeters:Math.round(distanceMeters),discoveryWindowMeters}]:[];
 }).sort((a,b)=>a.distanceMeters-b.distanceMeters||a.place.sourceId.localeCompare(b.place.sourceId)).slice(0,3);
}
function validDate(value:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(`${value}T00:00:00Z`);return Number.isFinite(d.valueOf())&&d.toISOString().slice(0,10)===value;}
/** Date is the selected record's visit date; never today's date or current GPS time. */
export function indoorOccurrencesOn(visitDate:string,facilityId='organizer-hanameguri'){
 if(!validDate(visitDate))return [];
 return raw.occurrences.filter(o=>{
  if(o.facility_id!==facilityId)return false;
  const period=raw.periods.find(p=>p.id===o.period_id);
  const start=o.precise_start_date??period?.start_date;
  const end=o.precise_end_date_inclusive??period?.end_date_inclusive;
  return Boolean(start&&end&&visitDate>=start&&visitDate<=end);
 }).map(o=>({...o,dateCertainty:o.precise_start_date&&o.precise_end_date_inclusive?'specified-window' as const:'within-period-seven-days-unconfirmed' as const}));
}
/** A missing binding must never be substituted with a source ID or a generated UUID. */
export function registeredResearchPavilion(place:ResearchPlace,bindings:ReadonlyMap<string,string>,existingIds:ReadonlySet<string>){
 const id=bindings.get(place.sourceId);
 return id&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)&&existingIds.has(id)?id:null;
}
