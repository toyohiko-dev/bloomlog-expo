import {createServerSupabaseClient} from '@/lib/supabase/server';
import {activityPhotoResponse} from '@/lib/activity-photo-response';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  return activityPhotoResponse(await createServerSupabaseClient(),new URL(request.url).searchParams.get('id'));
}
