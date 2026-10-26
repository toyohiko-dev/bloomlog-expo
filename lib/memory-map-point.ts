/** Versioned optional record position. Source/projection identity is regression-tested. */
const metadata={metadata:{"artworkId":"green-expo-places-v1","sourceVersion":"b199e8f23c5e1028f78552ce85ea0a2e69d9b61ed65efcd8aa047fe9af1e343d","projection":"local equirectangular; rigid 50 degree rotation; uniform physical scale; schematic artwork","rotationDegrees":50,"latitudeOrigin":35.485,"longitudeOrigin":139.488,"earthRadiusMeters":6371000,"rotatedBoundsMeters":[-418.5960799534706,-376.3850280490825,736.9367535698541,367.39689071444553],"artworkSize":[100,125],"center":[50,65],"unitsPerMeter":0.06923213056272293,"originalDiagramImagesCopied":false,"coordinateAccuracyMeters":null,"productionApproved":false}};
export const MAP_POINT_FRAME={eventId:'e60f2360-8147-4112-969a-00954596ceb6',mapId:metadata.metadata.artworkId,revision:'3073fb3b299d73fe74c86ea12df767d45c4c6c42efb02a08162cb6643ff71fdc'};
export type MapPoint={version:1;event_id:string;map_id:string;map_revision:string;x:number;y:number;source:'manual'|'photo-exif'|'current-gps';placement:'manual'|'projected';source_accuracy_m:number|null;confirmed:true};
export type MapPointDraft=Omit<MapPoint,'confirmed'>&{confirmed:false};
type Result={ok:true;value:MapPoint|null}|{ok:false;error:string};
const keys=['version','event_id','map_id','map_revision','x','y','source','placement','source_accuracy_m','confirmed'];
const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value);
/** Explicit NULL is different from an omitted field in a future edit payload. Never treat omission as clearing. */
export function decodeMapPoint(input:unknown):Result{
 if(input===null||input==='')return {ok:true,value:null};
 if(input===undefined)return {ok:false,error:'point-omitted'};
 try{
  const encoded=typeof input==='string'?input:JSON.stringify(input);if(encoded.length>2048)return {ok:false,error:'point-too-large'};
  const point=JSON.parse(encoded) as Record<string,unknown>;
  if(!point||typeof point!=='object'||Array.isArray(point)||Object.keys(point).length!==keys.length||keys.some(key=>!Object.hasOwn(point,key)))return {ok:false,error:'point-shape'};
  if(point.version!==1||point.confirmed!==true||!finite(point.x)||!finite(point.y)||point.x<0||point.x>1||point.y<0||point.y>1)return {ok:false,error:'point-unconfirmed-or-outside'};
  if(!['manual','photo-exif','current-gps'].includes(String(point.source))||!['manual','projected'].includes(String(point.placement)))return {ok:false,error:'point-provenance'};
  if(typeof point.event_id!=='string'||typeof point.map_id!=='string'||typeof point.map_revision!=='string')return {ok:false,error:'point-frame'};
  if(point.source==='current-gps'){if(!finite(point.source_accuracy_m)||point.source_accuracy_m<0||point.source_accuracy_m>100000)return {ok:false,error:'point-accuracy'};}
  else if(point.source_accuracy_m!==null||point.source==='manual'&&point.placement!=='manual')return {ok:false,error:'point-accuracy'};
  return {ok:true,value:point as MapPoint};
 }catch{return {ok:false,error:'point-invalid'};}
}
export function validateMapPoint(input:unknown,{eventId,pavilionId,activityType}:{eventId:string|null;pavilionId:string|null;activityType:string}):Result{
 const decoded=decodeMapPoint(input);if(!decoded.ok||!decoded.value)return decoded;const point=decoded.value;
 if(pavilionId||activityType==='pavilion_visit')return {ok:false,error:'point-is-not-facility-visit'};
 if(eventId!==MAP_POINT_FRAME.eventId||point.event_id!==eventId||point.map_id!==MAP_POINT_FRAME.mapId||point.map_revision!==MAP_POINT_FRAME.revision)return {ok:false,error:'point-frame-mismatch'};
 return decoded;
}
export function manualMapPoint(x:number,y:number,prior?:MapPointDraft|MapPoint):MapPointDraft|null{
 if(!finite(x)||!finite(y)||x<0||x>1||y<0||y>1)return null;
 return {version:1,event_id:MAP_POINT_FRAME.eventId,map_id:MAP_POINT_FRAME.mapId,map_revision:MAP_POINT_FRAME.revision,x,y,source:prior?.source??'manual',placement:'manual',source_accuracy_m:prior?.source_accuracy_m??null,confirmed:false};
}
/** A projection is a suggestion, never a confirmed save or a nearest-facility snap. */
export function projectedMapPoint(point:{latitude:number;longitude:number;accuracy:number},source:'photo-exif'|'current-gps',photoOrigin:'gallery'|'camera'|'none'):MapPointDraft|null{
 if(source==='current-gps'&&photoOrigin==='gallery')return null;
 if(!finite(point.latitude)||!finite(point.longitude)||Math.abs(point.latitude)>90||Math.abs(point.longitude)>180||source==='current-gps'&&(!finite(point.accuracy)||point.accuracy<0||point.accuracy>100000))return null;
 const m=metadata.metadata,R=m.earthRadiusMeters,t=m.rotationDegrees*Math.PI/180;
 const east=R*(point.longitude-m.longitudeOrigin)*Math.PI/180*Math.cos(m.latitudeOrigin*Math.PI/180),north=R*(point.latitude-m.latitudeOrigin)*Math.PI/180;
 const rotatedX=east*Math.cos(t)-north*Math.sin(t),rotatedY=-(east*Math.sin(t)+north*Math.cos(t));const [xmin,ymin,xmax,ymax]=m.rotatedBoundsMeters;
 const x=(m.center[0]+(rotatedX-(xmin+xmax)/2)*m.unitsPerMeter)/m.artworkSize[0],y=(m.center[1]+(rotatedY-(ymin+ymax)/2)*m.unitsPerMeter)/m.artworkSize[1];
 const draft=manualMapPoint(x,y);if(!draft)return null;
 // Existing JPEG accuracy=100 is a candidate search allowance, not measured EXIF accuracy.
 return {...draft,source,placement:'projected',source_accuracy_m:source==='current-gps'?point.accuracy:null};
}
export function confirmMapPoint(draft:MapPointDraft,explicitConfirmation:boolean):MapPoint|null{
 if(!explicitConfirmation)return null;const point={...draft,confirmed:true};const checked=validateMapPoint(point,{eventId:MAP_POINT_FRAME.eventId,pavilionId:null,activityType:'event_participation'});return checked.ok?checked.value:null;
}

/** Future edit adapter: absent field preserves storage; explicit NULL clears only after validation. */
export function resolveMapPointEdit(field:{present:boolean;value?:unknown},original:unknown,context:Parameters<typeof validateMapPoint>[1]):Result&{shouldWrite:boolean}{
 const checked=validateMapPoint(field.present?field.value:original??null,context);
 return {...checked,shouldWrite:field.present&&checked.ok};
}
