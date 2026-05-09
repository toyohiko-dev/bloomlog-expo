# DB Inspector Follow-up Task: storage policy executable remediation package

## task id

`task-005-db-inspector-storage-policy-remediation`

## agent role

DB Inspector Agent

## mission phase

focused execution-readiness package

## purpose

前回 DB Inspector report は documentation-only baseline を推奨したため、Mission intent を満たしていない。

この follow-up task は追加調査ではない。`activity-photos` storage insert policy remediation を、Human approval に進められる 1 つの executable remediation package として確定する。

## selected execution candidate

Select Option 3:

- targeted SQL remediation for `activity-photos` storage insert policy
- replace broad insert policy `activity_photos_insert_test`
- create owner-scoped insert policy `activity_photos_insert_own`

Parent may replace this only if it identifies a safer concrete production operation. Documentation-only recommendation is forbidden.

## input files

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-report.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`

## required output

Update:

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md`

Create:

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-storage-policy-remediation.md`

## required package contents

The report and approval draft must include:

- exact SQL
- rollback SQL
- verification SQL
- app behavior verification
- blast radius
- execution order
- approval boundaries

## exact SQL

Use this production SQL candidate. Do not execute it before Human approval.

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

Use this rollback SQL if the approved operation breaks uploads or needs to be reverted. Do not execute it before Human approval unless rollback approval is granted as part of the same operation.

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

Run after execution:

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

Expected result after apply:

- `activity_photos_insert_own` exists.
- `activity_photos_insert_test` does not exist.
- `activity_photos_insert_own` is `for insert` to `authenticated`.
- `with_check` includes `bucket_id = 'activity-photos'`.
- `with_check` includes first storage path segment equals `auth.uid()::text`.

Expected result after rollback:

- `activity_photos_insert_test` exists.
- `activity_photos_insert_own` does not exist.
- `activity_photos_insert_test` permits authenticated inserts into `activity-photos`.

## app behavior verification

After apply:

1. Sign in as a normal authenticated user.
2. Create or update one test 思い出 using the normal app flow.
3. Attach one photo through the normal activity photo upload UI.
4. Confirm upload succeeds.
5. Confirm the uploaded photo displays in the 思い出 detail or relevant timeline / record view.
6. Confirm the storage object path is under the authenticated user's first path segment.
7. If upload fails with storage authorization, execute the approved rollback SQL and rerun the same app behavior verification.

## blast radius

- production DB: storage policy metadata only
- affected table: `storage.objects`
- affected bucket: `activity-photos`
- affected operation: future insert only
- existing files: not modified
- public table schema: not modified
- RLS / policy impact: insert authorization becomes stricter
- app runtime risk: photo upload may fail if object paths are not user-prefixed
- rollback complexity: medium, simple SQL rollback but production authorization behavior changes

## execution order

1. Parent confirms this package is the selected candidate.
2. Reviewer reviews this package only.
3. QA validates exact SQL / rollback / verification / blast radius.
4. Parent finalizes `approval-needed.md`.
5. Human approves or rejects.
6. If approved, execute exact SQL.
7. Run verification SQL.
8. Run app behavior verification.
9. If app verification fails, execute approved rollback SQL.
10. Run rollback verification SQL and app behavior verification.
11. Update report and decision log.

## approval boundaries

Safe before Human approval:

- docs edits
- read-only review
- read-only verification SQL drafting

Requires Human approval:

- exact SQL apply
- rollback SQL apply
- any production SQL
- any dashboard setting change

Forbidden in this task:

- documentation-only recommendation
- additional investigation loop
- `no execution needed`
- `needs more research`
- `db push`
- `migration repair`
- destructive SQL
- secret request / storage

## completion criteria

- One executable remediation package is documented.
- `approval-needed.md` is a production-write approval draft for storage policy remediation.
- Reviewer / QA can review readiness without reopening drift analysis.

