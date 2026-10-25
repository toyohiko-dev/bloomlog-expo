-- Historical review only. Applied as 20261025151259; do NOT reapply.
-- REVIEW ONLY. Do not apply, db push, or repair migration history.
-- Target: existing project xavnxklqsupkosmywojn, public.pavilions only.
-- Reviewed row proposal: green-expo-facilities.rows.review.json, 216 places.
-- Approval is NOT granted; empty guard remains. Stage with is_active=false only.
-- Fill explicit new UUIDs + canonical unique names only after identity review.
-- Never reuse an old UUID based only on a matching name. No upsert, rename, delete,
-- event reassignment, grants, policies, Auth or Storage changes are included.
-- Keep source IDs, event binding, coordinate confidence and art anchors in the reviewed
-- local registry. Coordinates must not be inserted as illustration positions.
-- New rows become visible to existing SELECT consumers: event scoping must be verified first.
-- Rollback review: do not delete any row referenced by a saved record; preserve old records.
begin;
do $$
declare
  approved_rows jsonb := '[]'::jsonb;
  expected_count integer := 0;
  expected_event_id text := null;
begin
  if expected_count <= 0 or expected_event_id is null or jsonb_array_length(approved_rows) <> expected_count then
    raise exception 'REVIEW INCOMPLETE: source identities, target event and exact count required';
  end if;
  if not exists (select 1 from public.events where id::text = expected_event_id) then
    raise exception 'Target event does not exist; do not create or assign it implicitly';
  end if;
  if exists (select 1 from jsonb_to_recordset(approved_rows) as r(id uuid,name text,official_name text) join public.pavilions p on p.id=r.id or p.name=r.name) then
    raise exception 'Existing UUID/name collision: review identity; never overwrite or merge';
  end if;
  if exists (select 1 from jsonb_to_recordset(approved_rows) as r(id uuid,name text,official_name text) where id is null or name is null or btrim(name)='') then
    raise exception 'Every reviewed new facility requires an explicit UUID and name';
  end if;
  insert into public.pavilions (id,name,official_name,is_active)
  select id,name,official_name,false from jsonb_to_recordset(approved_rows) as r(id uuid,name text,official_name text);
  if (select count(*) from public.pavilions p join jsonb_to_recordset(approved_rows) as r(id uuid) on p.id=r.id) <> expected_count then
    raise exception 'Inserted count mismatch';
  end if;
end $$;
commit;
