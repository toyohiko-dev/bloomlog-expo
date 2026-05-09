# Approval Needed: operational rebaseline

## approval id

`approval-20260509-operational-rebaseline`

## mission id

`mission-20260509-operational-rebaseline`

## status

Executable approval-needed draft for production write.

Do not execute until Human approval is recorded.

## approval type

- production write
- storage policy change

## requested action

Approve the selected Option 3 execution package:

- replace broad `activity-photos` storage insert policy `activity_photos_insert_test`
- create owner-scoped insert policy `activity_photos_insert_own`
- restrict future `activity-photos` inserts to authenticated users writing under their own first path segment

This approval does not approve migration repair, `db push`, destructive SQL, dashboard changes, or secret changes.

## exact command / SQL / setting

Selected execution SQL:

```sql
begin;

drop policy if exists activity_photos_insert_test on storage.objects;
drop policy if exists activity_photos_insert_own on storage.objects;

create policy activity_photos_insert_own
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'activity-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
```

Explicitly not approved:

```powershell
npx.cmd supabase db push
npx.cmd supabase migration repair --status applied <version>
```

Destructive SQL, dashboard changes, and secret changes are also not approved.

## target environment

- service: Supabase
- app: Bloomlog
- environment: production Supabase operations
- target table: `storage.objects`
- target bucket: `activity-photos`
- secret handling: do not store project secrets, tokens, or connection strings in docs

## selected remediation package

- selected option: Option 3, targeted storage policy remediation
- target environment: Bloomlog Supabase production operations
- operation type: production SQL / storage policy change
- exact SQL: listed above
- expected effect: future inserts into `activity-photos` require authenticated user-owned path prefix
- blast radius: `storage.objects` insert authorization for `activity-photos`
- rollback: rollback SQL below
- verification: policy SQL verification and app behavior verification
- approval requested from Human: approve production storage policy remediation and rollback if needed

## risk

- Photo uploads may fail if current object paths do not use authenticated user id as the first path segment.
- Insert authorization becomes stricter for `activity-photos`.
- Existing stored objects are not modified.
- Public app tables are not modified.
- Rollback is available and restores the current broad insert policy.
- `db push` and migration repair remain unrelated and not approved.

## blast radius

| area | impact |
| --- | --- |
| production DB | storage policy metadata change only |
| table | `storage.objects` |
| bucket | `activity-photos` |
| operation affected | future inserts |
| existing objects | not modified |
| public app tables | not modified |
| RLS / policy | insert authorization becomes stricter |
| app runtime | photo upload may fail if object paths are not user-prefixed |
| rollback complexity | medium; simple SQL rollback but production authorization behavior changes |
| data loss risk | none expected |

## rollback

Rollback type: simple SQL rollback.

Rollback SQL:

```sql
begin;

drop policy if exists activity_photos_insert_own on storage.objects;
drop policy if exists activity_photos_insert_test on storage.objects;

create policy activity_photos_insert_test
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'activity-photos'
  );

commit;
```

Rollback trigger:

- upload fails with storage authorization after apply
- app behavior verification fails
- Human requests revert

Data loss risk: none expected.

## verification

Verification SQL:

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname in (
    'activity_photos_insert_test',
    'activity_photos_insert_own',
    'activity_photos_update_own',
    'activity_photos_delete_own'
  )
order by policyname;
```

Expected after apply:

- `activity_photos_insert_own` exists.
- `activity_photos_insert_test` does not exist.
- `activity_photos_insert_own` applies to `insert`.
- `roles` includes `authenticated`.
- `with_check` requires `bucket_id = 'activity-photos'`.
- `with_check` requires `(storage.foldername(name))[1] = auth.uid()::text`.

App behavior verification:

1. Sign in as a normal authenticated user.
2. Create or update one test 思い出 through the normal app flow.
3. Attach one photo through the normal activity photo upload UI.
4. Confirm upload succeeds.
5. Confirm the uploaded photo displays in the 思い出 detail or relevant timeline / record view.
6. Confirm the storage object path uses the authenticated user id as the first path segment.
7. If upload fails with storage authorization, execute approved rollback SQL and rerun this verification.

Expected after rollback:

- `activity_photos_insert_test` exists.
- `activity_photos_insert_own` does not exist.
- App photo upload behavior returns to previous authorization behavior.

## execution order

1. Parent confirms Option 3 is the selected execution candidate.
2. Reviewer reviews this package only.
3. QA validates exact SQL, rollback SQL, verification SQL, app behavior verification, blast radius, and approval boundaries.
4. Parent finalizes this approval draft, decision log, and parent summary after Reviewer / QA.
5. Parent commits and pushes docs-only final integration.
6. Human approves or rejects the production write.
7. If approved, execute the exact SQL in `exact command / SQL / setting`.
8. Run verification SQL.
9. Run app behavior verification.
10. If app behavior verification fails, execute the approved rollback SQL.
11. Run verification SQL again.
12. Rerun app behavior verification.
13. Update decision log and execution report.

## approval options

Human may choose:

- approve storage policy remediation
- reject storage policy remediation
- request changes to SQL / rollback / verification

## approval result

- selected option: approved Option 3, targeted `activity-photos` storage insert policy remediation
- decided by: Human
- decided at: 2026-05-09
- notes: Human approval was granted before execution. Apply SQL was executed by Executor; verification SQL passed. App behavior verification was blocked by local browser automation / authenticated-session availability, so rollback was not executed because no app upload failure was observed.
