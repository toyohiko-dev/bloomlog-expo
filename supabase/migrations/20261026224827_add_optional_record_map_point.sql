begin;
set local lock_timeout='2s';
set local statement_timeout='5s';
alter table public.activity_logs add column map_point jsonb null;
alter table public.activity_logs add constraint activity_logs_map_point_v1 check (
 map_point is null or coalesce(case when jsonb_typeof(map_point)='object'
  and map_point ?& array['version','event_id','map_id','map_revision','x','y','source','placement','source_accuracy_m','confirmed']
  and (map_point-array['version','event_id','map_id','map_revision','x','y','source','placement','source_accuracy_m','confirmed'])='{}'::jsonb
 then
  pavilion_id is null and activity_type<>'pavilion_visit'
  and map_point->'version'='1'::jsonb and map_point->'confirmed'='true'::jsonb
  and map_point->>'event_id'=event_id::text
  and map_point->>'event_id'='e60f2360-8147-4112-969a-00954596ceb6'
  and map_point->>'map_id'='green-expo-places-v1'
  and map_point->>'map_revision'='3073fb3b299d73fe74c86ea12df767d45c4c6c42efb02a08162cb6643ff71fdc'
  and case when jsonb_typeof(map_point->'x')='number' then (map_point->>'x')::numeric between 0 and 1 else false end
  and case when jsonb_typeof(map_point->'y')='number' then (map_point->>'y')::numeric between 0 and 1 else false end
  and map_point->>'source' in ('manual','photo-exif','current-gps')
  and map_point->>'placement' in ('manual','projected')
  and case when map_point->>'source'='current-gps' then
    case when jsonb_typeof(map_point->'source_accuracy_m')='number' then (map_point->>'source_accuracy_m')::numeric between 0 and 100000 else false end
   else map_point->'source_accuracy_m'='null'::jsonb and (map_point->>'source'<>'manual' or map_point->>'placement'='manual') end
 else false end,false)
) not valid;
alter table public.activity_logs validate constraint activity_logs_map_point_v1;
commit;
