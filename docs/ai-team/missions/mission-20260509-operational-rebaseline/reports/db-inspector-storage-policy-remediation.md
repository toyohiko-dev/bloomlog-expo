# DB Inspector Report: storage policy executable remediation package

## mission id

`mission-20260509-operational-rebaseline`

## task id

`task-005-db-inspector-storage-policy-remediation`

## agent role

DB Inspector Agent

## outcome

approval-ready execution candidate

## selected recommendation

Select Option 3: targeted SQL remediation for `activity-photos` storage insert policy.

The selected production operation replaces broad insert policy `activity_photos_insert_test` with owner-scoped insert policy `activity_photos_insert_own`.

Documentation-only recommendation is explicitly rejected for this follow-up.

## exact SQL

Do not execute before Human approval.

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

## rollback SQL

Rollback is included in the same approval package. Execute only if the approved apply operation fails verification or must be reverted.

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

## verification SQL

Run after apply and after rollback.

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

Expected after rollback:

- `activity_photos_insert_test` exists.
- `activity_photos_insert_own` does not exist.
- `activity_photos_insert_test` allows authenticated inserts into `activity-photos`.

## app behavior verification

Run after apply:

1. Sign in as a normal authenticated user.
2. Create or update one test 思い出 through the normal app flow.
3. Attach one photo through the normal activity photo upload UI.
4. Confirm the upload succeeds.
5. Confirm the uploaded photo displays in the 思い出 detail or relevant timeline / record view.
6. Confirm the storage object path uses the authenticated user id as the first path segment.
7. If upload fails with storage authorization, execute the approved rollback SQL and rerun this verification.

## blast radius

| area | impact |
| --- | --- |
| production DB | policy metadata change only |
| table | `storage.objects` |
| bucket | `activity-photos` |
| operation affected | future inserts |
| existing objects | not modified |
| public app tables | not modified |
| RLS / policy | insert authorization becomes stricter |
| app runtime | photo upload may fail if current object paths are not user-prefixed |
| rollback complexity | medium; simple SQL rollback but production auth behavior changes |
| data loss risk | none expected |

## execution order

1. Parent confirms Option 3 is the selected execution candidate.
2. Reviewer reviews this package only.
3. QA validates exact SQL, rollback SQL, verification SQL, app behavior verification, blast radius, and approval boundaries.
4. Parent finalizes `approval-needed.md`.
5. Human approves or rejects.
6. If approved, execute exact SQL.
7. Run verification SQL.
8. Run app behavior verification.
9. If app behavior verification fails, execute approved rollback SQL.
10. Run verification SQL again.
11. Rerun app behavior verification.
12. Update decision log and execution report.

## approval boundaries

No Human approval needed:

- docs edits
- package review
- QA of the package text

Human approval required:

- apply SQL
- rollback SQL
- any production SQL
- dashboard changes
- secret / environment variable changes

Forbidden:

- `db push`
- `migration repair`
- destructive SQL
- broad rebuild
- additional drift investigation loop
- documentation-only conclusion

## risk

- The selected policy is stricter than current remote policy.
- If the app currently uploads files outside `<auth.uid()>/...`, uploads will fail.
- The rollback SQL restores the current broad insert policy and should recover upload authorization.
- Existing stored photos are not deleted or modified.

## rollback

Rollback type: simple SQL rollback.

Rollback trigger:

- storage authorization failure after apply
- unexpected app upload failure
- Human requests revert

Rollback SQL is listed above.

## approval required?

Yes.

Approval type:

- production write
- storage policy change

## next action

- Parent should keep this as the selected execution candidate.
- Reviewer / QA should review this package without reopening drift analysis.
- Parent should keep `approval-needed.md` as the single approval draft for this package.

