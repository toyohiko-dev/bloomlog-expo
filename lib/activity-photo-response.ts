import type {SupabaseClient} from '@supabase/supabase-js';
const headers={'Cache-Control':'private, no-store, max-age=0','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
/** Same-origin authenticated bytes: no public or expiring signed URL reaches the browser. */
export async function activityPhotoResponse(client:SupabaseClient,recordId:string|null):Promise<Response>{
  try{
    const {data:{user},error}=await client.auth.getUser();
    if(error||!user)return new Response(null,{status:401,headers});
    if(!recordId||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(recordId))return new Response(null,{status:404,headers});
    const {data:record,error:recordError}=await client.from('activity_logs').select('photo_path').eq('user_id',user.id).eq('id',recordId).maybeSingle();
    const path=record?.photo_path;
    if(recordError||typeof path!=='string'||path.length>1024||path.includes('..')||/[\\%\x00-\x1f\x7f:?#]/.test(path)||path.split('/').length!==3||path.split('/').some(part=>!part)||path.split('/')[0]!==user.id)return new Response(null,{status:404,headers});
    const {data:photo,error:photoError}=await client.storage.from('activity-photos').download(path);
    if(photoError||!photo||!['image/jpeg','image/png','image/webp'].includes(photo.type)||photo.size>10*1024*1024)return new Response(null,{status:404,headers});
    return new Response(photo,{headers:{...headers,'Content-Type':photo.type,'Content-Disposition':'inline'}});
  }catch{return new Response(null,{status:503,headers});}
}
