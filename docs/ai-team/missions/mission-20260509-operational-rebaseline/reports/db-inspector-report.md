# DB Inspector Report: operational rebaseline

## supersession notice

This report is superseded for execution selection.

The documentation-only recommendation failed the Mission intent because the Mission requires one approval-ready execution package. Use the focused follow-up package instead:

- task: `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/db-inspector-storage-policy-remediation.md`
- report: `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-storage-policy-remediation.md`
- approval draft: `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`

Selected execution candidate is Option 3, `activity-photos` storage insert policy remediation.

## mission id

`mission-20260509-operational-rebaseline`

## task id

`task-002-db-inspector-operational-baseline`

## agent role

DB Inspector Agent

## summary

前回 Mission の read-only evidence をもとに、Bloomlog Supabase operations の forward-only operational baseline を提案する。

推奨パスは **Option 1: documentation-only operational baseline now**。現在の remote schema を primary operational reality として採用し、historical migration purity、full repo migration replay、`db push` default workflow、migration repair first という旧期待を放棄する。DB write は行わず、今後の DB 変更は明示的な approved SQL / migration proposal と read-only verification で進める。

この report は production write を実行しない。`migration repair`、`db push`、production SQL、destructive SQL、`supabase/migrations/` 変更は行っていない。

## input files read

- `docs/product/dev.md`
- `docs/product/overview.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/mission.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/db-inspector.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/parent-summary.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `supabase/migrations/`

## output files changed

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-report.md`

## commands run

```powershell
git status --short
Get-Content -LiteralPath docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/db-inspector.md -Encoding UTF8
Get-ChildItem -LiteralPath docs/ai-team/missions/mission-20260509-operational-rebaseline -Recurse -File | Select-Object -ExpandProperty FullName
Get-ChildItem -LiteralPath docs/product -Recurse -File | Select-Object -ExpandProperty FullName
Get-Content -LiteralPath docs/product/dev.md -Encoding UTF8
Get-Content -LiteralPath docs/product/overview.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/parent-summary.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/supabase-migration-ops.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/agent-operating-model.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/agent-review-workflow.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/agent-communication-protocol.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/missions/mission-20260509-operational-rebaseline/mission.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md -Encoding UTF8
Get-Content -LiteralPath docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md -Encoding UTF8
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
```

## evidence reused from previous mission

Previous DB Inspector read-only evidence established:

- `npx.cmd supabase migration list` showed 10 local migrations and empty remote column.
- remote DB did not expose `supabase_migrations` schema.
- migration-like tables existed only under `auth`, `realtime`, and `storage`.
- public remote tables observed: `activity_logs`, `areas`, `countries`, `events`, `pavilion_aliases`, `pavilions`, `profiles`, `spots`, `visit_sessions`.
- remote-only operational elements observed: `events`, `areas`, `countries`, `spots`, `pavilions.image_path`, read-all policies for those tables, remote-only visit session unique constraints.
- missing old repo expectations observed: `public.assign_visit_session_user_id`, `public.sync_activity_log_user_id`, `set_visit_session_user_id`, `set_activity_log_user_id`, `visit_sessions_user_id_visit_date_idx`, `activity_logs_user_id_session_id_idx`.
- storage bucket `activity-photos` existed and was public.
- storage insert policy differed from repo expectation: remote had `activity_photos_insert_test`.

Current Mission assumes that evidence is sufficient and does not reopen open-ended investigation.

## operational source of truth

Canonical for future operations:

1. Current remote schema is the primary operational reality.
2. Documented accepted drift in this mission is part of the operational baseline.
3. Future DB changes must be explicit approved SQL / migration proposals with rollback and read-only verification.
4. Repo docs under `docs/ai-team/missions/mission-20260509-operational-rebaseline/` are the source of truth for operational decisions from this point forward.
5. Historical repo migration files remain useful evidence, but they are not treated as the complete canonical state of production.

Not canonical for default operations:

- empty / unreadable remote migration history as a signal that all repo migrations should be replayed.
- `db push` as default workflow.
- perfect historical migration reconstruction as a prerequisite for every future DB operation.

## canonical remote-only schema

| remote-only item | classification | rationale | action |
| --- | --- | --- | --- |
| `events` table | canonical | Product overview defines Event as core hierarchy. App code reads `events`. | Adopt in operational baseline. |
| `areas` table | canonical | Product docs define Area as Pavilion grouping. App code reads `areas` for `/collection-next`. | Adopt in operational baseline. |
| `countries` table | canonical pending explicit product approval | Remote has it and policies allow reads. Product docs do not make Country central, but Pavilion domain can use country metadata. | Keep; do not remove. Parent/Sakura can decide whether to promote into product docs later. |
| `spots` table | canonical pending explicit product approval | Product docs define Spot as future map location. Current dev docs say Spot is not used for heatmap. | Keep as future map baseline; do not use for heatmap by default. |
| `pavilions.image_path` | canonical | Product docs explicitly say Pavilion images use `pavilions.image_path`. App code reads it. | Adopt in operational baseline. |
| read-all policies for `events` / `areas` / `countries` / `spots` | canonical pending security review | They support app read flows, but should be reviewed as part of RLS policy baseline. | Keep; verify before any policy change. |
| `visit_sessions_user_id_event_id_visit_date_key` | canonical pending app behavior review | More precise than date-only uniqueness for multi-event/user model. | Keep; document as operational baseline. |
| `visit_sessions_visit_date_key` | unknown but accepted temporarily | May constrain one visit day per date globally and conflict with multi-user/multi-event model. Removing it is destructive behavior change. | Do not remove now; separate approval item if product requires multi-user same date. |

## abandoned old repo expectations

These old expectations should no longer block operations:

- Perfect migration history reconstruction.
- `db push` as default workflow.
- Full repo migration replay.
- Repairing migration history before any future DB operation.
- Full parity with old repo migration expectations before action.

Missing old repo expectations:

| missing item | operational decision | rationale |
| --- | --- | --- |
| `public.assign_visit_session_user_id` | future separate approval item, not baseline blocker | Remote appears operational without it. Restoring may change write behavior. |
| `public.sync_activity_log_user_id` | future separate approval item, not baseline blocker | Same as above; restoring should be tied to app write-path evidence. |
| `set_visit_session_user_id` trigger | future separate approval item, not baseline blocker | Trigger restore is production write and can affect all inserts / updates. |
| `set_activity_log_user_id` trigger | future separate approval item, not baseline blocker | Trigger restore is production write and can affect all inserts / updates. |
| `visit_sessions_user_id_visit_date_idx` | intentionally abandoned candidate unless performance evidence appears | Remote has other visit session unique indexes; not required for baseline. |
| `activity_logs_user_id_session_id_idx` | future performance item only | Index creation can be useful but should be justified by query/performance evidence. |
| repo storage insert policy name / definition | future security approval item | Current policy may be broader than desired, but changing storage policy can break uploads. |

## concrete remediation strategy

### Option 1: documentation-only operational baseline now

Status: recommended.

Goal:

- Adopt current remote schema as canonical operational reality in docs.
- Record accepted drift.
- Keep future DB changes on explicit approval path.
- Do not modify production DB.

Exact operations:

```powershell
git status --short
git diff --name-only
git diff --stat
```

Docs operation:

```text
Write and review docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-report.md
Parent later integrates reviewer / QA outputs into parent-summary.md, decision-log.md, and approval-needed.md if needed.
```

Production write:

```text
none
```

Human approval required:

- No, for docs-only baseline.
- Yes, for any future DB write.

Risk:

- `db push` remains unavailable as default workflow.
- Future DB operations require explicit SQL and approval preparation.
- Accepted drift must be respected by future Agents.

Rollback:

- rollback type: docs revert.
- exact rollback: revert the docs commit or edit this report / Parent summary to remove the operational baseline decision.
- data loss risk: none.

Verification:

```powershell
git diff --name-only
git diff --stat
```

Expected:

- changed files are under `docs/ai-team/missions/mission-20260509-operational-rebaseline/`.
- no `app/`, `lib/`, `supabase/migrations/`, `package.json`, `.env*` changes.

### Option 2: adopt remote schema as canonical and create future baseline snapshot proposal

Status: recommended as next phase after Option 1 review.

Goal:

- Produce a future repo-managed baseline snapshot document or SQL proposal that describes current remote schema as baseline.
- Do not replay old migrations.
- Do not use `db push`.
- Do not modify `supabase/migrations/` in this task.

Exact operations for this task:

```text
none beyond this report
```

Future docs-only operation candidate:

```text
Create docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/remote-schema-baseline-snapshot.md
```

Future baseline snapshot should include:

- canonical public tables / columns.
- RLS states.
- policies.
- triggers / functions.
- indexes / constraints.
- storage buckets / policies.
- accepted drift list.
- rejected workflows.

Human approval required:

- No, if the future snapshot is docs-only.
- Yes, if the future task creates or modifies migration files or executes SQL.

Risk:

- Snapshot can become stale if not updated after future DB changes.
- If named as a "migration" too early, future Agents may mistake it for executable schema.

Rollback:

- rollback type: docs revert.
- exact rollback: revert the snapshot docs change.
- data loss risk: none.

Verification:

```powershell
git diff --name-only
git diff --stat
npx.cmd supabase migration list
```

Read-only SQL examples for snapshot verification:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

### Option 3: targeted SQL remediation for storage insert policy

Status: optional future approval item, not selected in this task.

Why this is the only targeted SQL candidate included:

- It is bounded to one storage policy.
- It addresses a plausible security drift: current remote insert policy appears broader than repo expectation.
- It does not require historical migration reconstruction.

Not included in this option:

- restoring missing user-id functions / triggers.
- creating user-id indexes.
- repairing migration history.
- changing remote-only tables.

Exact SQL proposal:

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

Human approval required:

- Yes.
- Approval type: production write / storage policy change.

Risk:

- Photo uploads may fail if current app stores object paths in a format that does not begin with `auth.uid()`.
- Existing objects are not changed, but future inserts are restricted.
- If `activity_photos_insert_test` is intentionally broad for current upload flow, this breaks that flow.

Rollback:

rollback type: simple SQL rollback.

Exact rollback SQL:

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

Data loss risk:

- none expected. Policy changes affect authorization, not stored rows / objects.

Verification after apply:

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

App behavior verification after apply:

```text
Create or update a test 思い出 with an activity photo using the normal app flow in the target environment, then confirm upload and display still work.
```

Blocking evidence before selecting this option:

- Confirm current app upload path format uses `<auth.uid()>/...` for `activity-photos`.
- Confirm this policy change is desired now rather than deferred.

## exact operations

Recommended operation for this task:

```text
Option 1 only: write docs-only operational baseline report.
```

Safe read-only pre-approval commands for later phases:

```powershell
git status --short
git diff --name-only
git diff --stat
npx.cmd supabase migration list
```

Safe read-only SQL for later phases:

```sql
select schema_name
from information_schema.schemata
where schema_name in ('supabase_migrations', 'auth', 'realtime', 'storage')
order by schema_name;
```

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

```sql
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;
```

Forbidden operations in this task:

```powershell
npx.cmd supabase migration repair --status applied <version>
npx.cmd supabase db push
```

## rollback plan

| candidate | rollback type | exact rollback | data loss risk | verification after rollback |
| --- | --- | --- | --- | --- |
| Option 1 docs-only baseline | docs revert | revert this report / parent docs change | none | `git diff --name-only` |
| Option 2 docs-only snapshot | docs revert | revert future snapshot doc | none | `git diff --name-only` |
| Option 3 storage policy SQL | simple SQL rollback | rollback SQL in Option 3 | none expected | storage `pg_policies` query + app upload smoke check |
| migration repair | not selected | if later selected, prepare `migration repair --status reverted <version>` commands | none to data, high to migration history correctness | `npx.cmd supabase migration list` |
| `db push` | rejected | not safely reversible | possible schema/data behavior risk | not applicable |

## verification plan

Pre-approval read-only verification:

```powershell
npx.cmd supabase migration list
```

Migration history:

- confirm local 10 migrations still appear.
- confirm remote state remains known and documented.

Canonical tables / columns:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

RLS / policies:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

Triggers / functions:

```sql
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;
```

```sql
select n.nspname as schema_name, p.proname as function_name
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;
```

Indexes / constraints:

```sql
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
```

```sql
select tc.table_name, tc.constraint_name, tc.constraint_type
from information_schema.table_constraints tc
where tc.table_schema = 'public'
order by tc.table_name, tc.constraint_name;
```

Storage bucket / policies:

```sql
select id, name, public
from storage.buckets
order by id;
```

```sql
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
```

## blast radius assessment

| area | Option 1 docs-only | Option 2 snapshot docs | Option 3 storage policy SQL |
| --- | --- | --- | --- |
| app runtime | none | none | possible upload breakage if path format differs |
| auth / RLS | none | none | storage authorization behavior changes |
| storage uploads | none | none | affected for new activity photo inserts |
| future migration workflow | clarifies `db push` is not default | improves future baseline clarity | no direct migration improvement |
| production DB risk | none | none if docs-only | medium |
| rollback complexity | low | low | medium |

## execution order

### Phase 1: pre-approval read-only verification

- Run safe read-only CLI / SQL verification only.
- Confirm target environment without storing secrets.
- Confirm docs-only diff if only Option 1 or Option 2 docs path is selected.

### Phase 2: Human approval

- Required only if selecting Option 3 or any future production write.
- Not required for Option 1 docs-only baseline.

### Phase 3: approved operation

- Option 1: docs-only report / integration.
- Option 2 future: docs-only snapshot unless migration files or SQL are explicitly approved.
- Option 3 future: run exact approved SQL only after approval.

### Phase 4: post-operation read-only verification

- Re-run relevant read-only SQL.
- For Option 3, verify storage policy and app upload behavior.

### Phase 5: report / decision-log update

- Parent updates `parent-summary.md`.
- Parent updates `decision-log.md`.
- Parent updates `approval-needed.md` only if approval gate is entered or resolved.

## approval boundaries

Safe docs-only work:

- Writing this report.
- Parent / Reviewer / QA reports under this mission.
- Decision log updates that do not approve production write.

Safe read-only commands:

- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- `npx.cmd supabase migration list`
- read-only `select` SQL listed in this report.

Human approval required writes:

- production SQL.
- storage policy changes.
- migration repair.
- `db push`.
- migration file creation intended for production application.
- dashboard setting changes.
- secret / environment variable changes.

Forbidden operations in this task:

- `npx.cmd supabase migration repair`
- `npx.cmd supabase db push`
- production SQL execution
- destructive SQL execution
- `supabase/migrations/` modification
- secret request / storage

## recommended path

Adopt Option 1 now.

Then Parent should integrate this as:

- current remote schema is operational source of truth.
- remote-only schema listed here is accepted as canonical or temporarily accepted.
- perfect migration reconstruction is abandoned as a blocker.
- `db push` remains rejected as default workflow.
- no production write is requested in this task.
- Option 3 may become a future approval item only after upload path evidence confirms it is safe.

## validation

- validation performed:
  - task file read.
  - product docs read.
  - previous DB Inspector / Parent / approval / decision evidence read.
  - current mission / approval / decision docs read.
  - repo migration list read.
- validation result:
  - report satisfies required sections and contains recommended path.
  - no DB write was executed.
  - no migration repair or `db push` was executed.
- validation not performed:
  - new remote SQL introspection in this task.
  - production SQL.
  - app upload smoke test.
- reason:
  - task says this is not open-ended investigation and should use previous evidence.
  - app behavior test is only needed before selecting Option 3.

## risks

- If future Agents ignore this baseline, they may re-enter historical reconstruction loops.
- If current remote-only schema is later found accidental, adopting it now may require a future deprecation plan.
- If `visit_sessions_visit_date_key` conflicts with future multi-user / multi-event use, removing it will need a separate approval and rollback plan.
- Option 3 storage policy remediation may break uploads if path assumptions are wrong.

## unknowns

Decision-blocking unknowns for Option 1:

- none.

Decision-blocking unknowns for Option 3:

- current upload object path format for `activity-photos`.
- whether broad insert policy is intentionally required for current app flow.

Non-blocking unknowns:

- exact historical origin of remote-only schema.
- exact historical reason missing functions / triggers / indexes are absent.

## approval required?

For recommended Option 1:

- no.

For future Option 2 docs-only snapshot:

- no, unless it creates migration files or executable production SQL.

For Option 3 storage policy SQL:

- yes.

For migration repair / `db push`:

- yes, but both are not selected.

## next action

- Reviewer Agent reviews whether this report stays within operational rebaseline scope and avoids investigation loop.
- QA Agent validates exact operations, rollback, verification, and approval boundaries.
- Parent Agent integrates the selected Option 1 into `parent-summary.md` and `decision-log.md`.
- Do not update `approval-needed.md` into an executable approval request unless Parent selects Option 3 or another production write candidate.
