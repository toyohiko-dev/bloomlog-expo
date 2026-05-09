# Parent Summary Report: operational rebaseline final integration

## mission id

`mission-20260509-operational-rebaseline`

## task id

`task-001-parent-operational-rebaseline`

## agent role

Parent Agent

## mission phase

final execution-readiness integration after Reviewer / QA

## outcome

approval-ready

Selected execution path: **Option 3: targeted `activity-photos` storage insert policy remediation**.

No additional investigation is requested. No drift analysis is reopened. No production SQL, `db push`, `migration repair`, destructive SQL, dashboard change, secret change, migration file change, or app code change was executed.

## input files integrated

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-report.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-storage-policy-remediation.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/reviewer-report.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/qa-report.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/mission.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md`

## selected operational source of truth

Future Bloomlog Supabase operations should treat the following as the operational source of truth:

1. Current remote schema is the primary operational reality.
2. Accepted drift documented in this Mission remains part of the operational baseline.
3. Future DB changes must use explicit approved SQL / migration proposals with rollback, verification, blast radius, execution order, and approval boundaries.
4. This Mission's docs under `docs/ai-team/missions/mission-20260509-operational-rebaseline/` are the source of truth for this rebaseline decision.

Historical repo migrations remain evidence, not the complete production source of truth.

## canonical remote-only schema decision

The following remote-only items remain accepted for operations and are not removed in this Mission:

- `events`: canonical
- `areas`: canonical
- `countries`: canonical pending explicit product approval
- `spots`: canonical pending explicit product approval
- `pavilions.image_path`: canonical
- read-all policies for `events` / `areas` / `countries` / `spots`: canonical pending later security review
- `visit_sessions_user_id_event_id_visit_date_key`: canonical pending app behavior review
- `visit_sessions_visit_date_key`: unknown but accepted temporarily; do not remove in this Mission

## abandoned repo expectations

The following expectations are no longer blockers:

- perfect migration history reconstruction
- `db push` as default workflow
- full repo migration replay
- migration repair before any future DB operation
- full parity with old repo migration expectations before action

Missing old repo functions, triggers, indexes, and storage policy definitions remain future separate approval items only.

## recommended remediation option

Recommended remediation is Option 3:

- replace broad `activity-photos` storage insert policy `activity_photos_insert_test`
- create owner-scoped insert policy `activity_photos_insert_own`
- restrict future inserts into `activity-photos` to authenticated users writing under their own first storage path segment

Reviewer and QA both judged the package ready and found no blocking findings.

## exact operations

Production SQL is not approved until Human approval is recorded.

Apply SQL:

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

Destructive SQL, dashboard changes, secret changes, broad schema rebuild, app code changes, and `supabase/migrations/` edits are also not approved.

## rollback plan

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

Data loss risk: none expected, because existing stored objects are not modified.

## verification plan

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
5. Confirm the uploaded photo displays in the 思い出 detail or relevant タイムライン / 記録 view.
6. Confirm the storage object path uses the authenticated user id as the first path segment.
7. If upload fails with storage authorization, execute approved rollback SQL and rerun this verification.

Expected after rollback:

- `activity_photos_insert_test` exists.
- `activity_photos_insert_own` does not exist.
- App photo upload behavior returns to previous authorization behavior.

## blast radius assessment

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

## execution order

1. Parent confirms Option 3 as selected execution candidate.
2. Reviewer reviews this package only.
3. QA validates exact SQL, rollback SQL, verification SQL, app behavior verification, blast radius, and approval boundaries.
4. Parent finalizes `approval-needed.md`, `decision-log.md`, and this `parent-summary.md`.
5. Parent commits and pushes docs-only integration.
6. Human approves or rejects the production write.
7. If approved, execute the exact apply SQL.
8. Run verification SQL.
9. Run app behavior verification.
10. If app behavior verification fails, execute the approved rollback SQL.
11. Run verification SQL again.
12. Rerun app behavior verification.
13. Update decision log and execution report.

## approval boundaries

No Human approval needed:

- docs edits
- package review
- QA of package text
- Parent final integration commit / push

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
- documentation-only conclusion as the final Mission answer

## approval-needed status

`approval-needed.md` is an executable approval draft for Option 3, pending Human approval.

It is ready for a Human approve / reject / request-changes decision. It must not be executed until Human approval is recorded.

## next task file path

`docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`

This is the next Human-facing approval gate. If approved, execution must use only the exact SQL package documented there.

## human approval required?

No for this docs-only final integration.

Yes before applying the storage policy SQL, applying rollback SQL, or running any other production SQL / dashboard / secret operation.

## final judgment

Approval-ready: yes.

Recommended execution: present Option 3 storage policy remediation to Human for approval, then stop before production writes until approval is recorded.

---

## lifecycle finalization addendum

Update date: 2026-05-09

Current lifecycle status: `verification-partial`.

Reason:

- Human approval for Option 3 was granted before execution.
- Executor applied the approved SQL package only.
- Verification SQL passed and observed the expected storage policy state.
- No `db push`, migration repair, destructive SQL, migration file edit, or app code change occurred.
- Authenticated app smoke verification remains unavailable in this execution environment.

Parent finalization actions completed:

- `mission.md` status fields updated.
- `decision-log.md` state transition entry added.
- `reports/execution-report.md` updated with proposed mission state.
- residual risk documented.

Next action:

- Separate authenticated app photo upload smoke verification into follow-up before moving this Mission to `completed`.
