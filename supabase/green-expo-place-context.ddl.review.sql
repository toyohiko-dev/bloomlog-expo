-- REVIEW ONLY. Historical draft, applied separately as 20261025151259. Do NOT reapply.
-- Target project xavnxklqsupkosmywojn / public.activity_logs.
-- No grants, policies, Auth, Storage, existing record rewrite, or data deletion.
-- Runtime must validate source IDs against the imported catalog, chosen visit date,
-- and the existing parent pavilion UUID before accepting this context.
-- Old rows remain NULL and old clients can continue using pavilion_id.
begin;
do $$
begin
  raise exception 'REVIEW ONLY: explicit approval and server validation required before applying';
end $$;
alter table public.activity_logs add column place_context jsonb null;
alter table public.activity_logs add constraint activity_logs_place_context_object
  check (place_context is null or (jsonb_typeof(place_context) = 'object' and (place_context ->> 'version') is not distinct from '1'));
rollback;
