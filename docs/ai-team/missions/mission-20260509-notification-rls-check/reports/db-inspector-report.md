# DB Inspector Report: Notification RLS Check

## mission id

`mission-20260509-notification-rls-check`

## task id

`task-001-db-inspector`

## agent role

- DB Inspector Agent

## summary

`NTF-20260509-01` の Supabase security alert について、repo docs、migration、remote DB を read-only で確認した。

結論として、`visit_sessions`、`activity_logs`、`profiles`、`activity-photos` storage policy は現在の read-only evidence 上、owner-scoped な状態になっている。即時の DB write、dashboard 変更、`db push`、migration repair は不要。

## proposed mission state

- proposed status: completed
- reason: main RLS / policy / sensitive column checks passed; no gated remediation candidate remains for this queue entry
- required Parent action: update mission state and parent summary

## input files read

- `AGENTS.md`
- `docs/ai-team/mission-lifecycle.md`
- `docs/ai-team/ops/notification-intake/queue.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/supabase-rls-remediation-checklist.md`
- `supabase/migrations/`

## output files changed

- `docs/ai-team/missions/mission-20260509-notification-rls-check/reports/db-inspector-report.md`

## commands run

```powershell
git status --short
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
Test-Path supabase\config.toml; Get-ChildItem supabase -Force
npx supabase --version
npx.cmd supabase --version
npx.cmd supabase migration list
npx.cmd supabase db query --help
```

`npx supabase --version` は PowerShell の `npx.ps1` execution policy で失敗した。以後は Windows の `npx.cmd` を使用した。

## read-only SQL run

すべて `npx.cmd supabase db query --linked --output json "<SELECT ...>"` で実行した。DB write、migration repair、`db push`、destructive SQL は実行していない。

確認した項目:

- target public tables RLS status。
- target public table policies。
- `storage.objects` policies。
- sensitive column candidates。
- migration schema visibility。
- migration table visibility。
- trigger list。
- `pavilions` / `pavilion_aliases` column list。

## repo migrations observed

Repo migration files:

- `20260322163000_make_activity_logs_occurred_at_nullable.sql`
- `20260322193000_update_activity_logs_acquisition_method_check.sql`
- `20260324120000_add_pavilions_master.sql`
- `20260328120000_add_pavilion_aliases.sql`
- `20260404235000_add_auth_to_visit_sessions_and_activity_logs.sql`
- `20260405001000_fix_profiles_add_nickname_column.sql`
- `20260405003000_add_profiles.sql`
- `20260405012000_unify_profiles_display_name.sql`
- `20260405190000_add_activity_log_photo_path.sql`
- `20260508100000_fix_visit_sessions_and_activity_logs_rls.sql`

## remote migration history observed

`npx.cmd supabase migration list`:

- local 10 migrations were listed.
- remote column was empty for all rows.

Read-only schema checks:

- `auth`, `realtime`, `storage` schemas exist.
- `supabase_migrations` schema was not observed.
- migration-like tables observed:
  - `auth.schema_migrations`
  - `realtime.schema_migrations`
  - `storage.migrations`

Judgment:

- remote migration history visibility issue remains.
- `db push` remains unsafe as a standard path.
- no migration repair is proposed in this Mission.

## RLS status observed

| table | RLS |
| --- | --- |
| `activity_logs` | on |
| `profiles` | on |
| `visit_sessions` | on |
| `pavilions` | off |
| `pavilion_aliases` | off |

Interpretation:

- Owner data tables checked by this Mission are RLS ON.
- `pavilions` and `pavilion_aliases` are RLS OFF. Their observed columns are master/reference data, not owner user data. Existing docs already treat these as public-read master data / separate later security review, not as this queue entry's immediate remediation target.

## policy summary

`visit_sessions`:

- `visit_sessions_select_own`: `auth.uid() = user_id`
- `visit_sessions_insert_own`: role `authenticated`, `with_check auth.uid() = user_id`
- `visit_sessions_update_own`: `auth.uid() = user_id`
- `visit_sessions_delete_own`: `auth.uid() = user_id`

`activity_logs`:

- `activity_logs_select_own`: `auth.uid() = user_id`
- `activity_logs_insert_own`: role `authenticated`, `with_check auth.uid() = user_id`
- `activity_logs_update_own`: `auth.uid() = user_id`
- `activity_logs_delete_own`: `auth.uid() = user_id`

`profiles`:

- `profiles_select_own`: `auth.uid() = id`
- `profiles_insert_own`: `auth.uid() = id`
- `profiles_update_own`: `auth.uid() = id`

Storage `activity-photos`:

- insert / update / delete policies exist for role `authenticated`.
- insert `with_check` requires the first storage path segment to equal `auth.uid()::text`.

## sensitive column assessment

Observed sensitive or ownership-related columns:

- `activity_logs.user_id`
- `activity_logs.photo_path`
- `profiles.display_name`
- `visit_sessions.user_id`

Assessment:

- `activity_logs` is RLS ON with owner-scoped policies.
- `profiles` is RLS ON with owner-scoped policies.
- `visit_sessions` is RLS ON with owner-scoped policies.
- `activity-photos` storage policy is owner-scoped for insert/update/delete.

Observed public master/reference columns:

- `pavilions.name`
- `pavilions.official_name`
- `pavilions.country_id`
- `pavilions.area_id`
- `pavilions.spot_id`
- `pavilions.image_path`
- `pavilion_aliases.alias`

Assessment:

- These are not user ownership columns.
- RLS OFF on these master/reference tables should be handled as a separate product/security policy decision if Supabase Advisor continues to flag them.

## incomplete check

An additional query for all public table RLS state failed after repeated retries with Supabase pooler error:

```text
ECIRCUITBREAKER: too many authentication failures, new connections are temporarily blocked
```

Because the target-table RLS check had already succeeded, no further remote SQL was attempted.

## classification

`NTF-20260509-01` is classified as:

- historical/resolved for `visit_sessions`, `activity_logs`, `profiles`, and `activity-photos` storage policy.
- no immediate gated remediation required.
- residual risk remains for the exact Supabase Advisor target, because the queue entry intentionally does not preserve raw email body or dashboard URL.

## approval required?

no

## approval reason

- approval type: none
- reason: no DB write, dashboard change, credential change, `db push`, migration repair, or destructive SQL is proposed
- approval-needed file: none

## risks

- Exact Supabase Advisor target is not available from the sanitized queue entry.
- Full public table RLS sweep was not completed because Supabase temporarily blocked new CLI connections.
- `pavilions` / `pavilion_aliases` remain RLS OFF as public master/reference tables and may still be flagged by generic security tooling.

## rollback

- rollback needed: no
- rollback plan: none
- rollback not needed because: no write operation was performed

## next action

No immediate remediation.

If Supabase Advisor continues to show a specific active alert, create a new sanitized queue entry that identifies the target category without storing raw body, dashboard URL, project ID, or internal IDs.
