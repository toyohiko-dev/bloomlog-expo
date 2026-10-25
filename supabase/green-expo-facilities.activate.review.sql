-- REVIEW ONLY; NOT APPLIED. Target xavnxklqsupkosmywojn / public.pavilions.
-- Only the 216 NEW UUIDs in green-expo-facilities.rows.review.json may be activated.
-- Requires verified production commit with scoped lists, legacy compatibility,
-- source bindings, context validation, and explicit publication/DB-write approval.
-- Never activate held IDs or update any of the existing 11 rows.
begin;
do $$
declare
  approved_ids uuid[] := '{}';
  expected_count integer := 216;
  production_commit_verified boolean := false;
  changed integer;
begin
  if not production_commit_verified or cardinality(approved_ids) <> expected_count then
    raise exception 'REVIEW ONLY: verified application release and exact approved IDs required';
  end if;
  if (select count(distinct id) from unnest(approved_ids) as ids(id)) <> expected_count then
    raise exception 'Duplicate approved IDs';
  end if;
  if (select count(*) from public.pavilions where id=any(approved_ids) and is_active=false) <> expected_count then
    raise exception 'Staging rows missing or already active; inspect outcome before retry';
  end if;
  update public.pavilions set is_active=true where id=any(approved_ids) and is_active=false;
  get diagnostics changed = row_count;
  if changed <> expected_count then raise exception 'Activation count mismatch'; end if;
end $$;
rollback;
