# DB Inspector Report

## mission id

`mission-20260509-supabase-migration-history`

## task id

`task-002-db-inspector-read-only-inventory`

## agent role

DB Inspector Agent

## summary

Supabase remote migration history と remote schema / RLS / policy / trigger / function を read-only で棚卸しした。

`npx.cmd supabase migration list` では repo 側の 10 migration が local に並ぶ一方、remote 列はすべて空だった。remote DB には `supabase_migrations` schema が存在せず、migration 名を含む table は Supabase 内部用の `auth.schema_migrations`、`realtime.schema_migrations`、`storage.migrations` のみだった。

remote schema は repo migration の多くを反映しているが、`public.assign_visit_session_user_id` / `public.sync_activity_log_user_id` と対応 trigger が存在しない、repo にない table / column / policy が remote に存在する、storage policy が repo migration と一致しない、という schema drift も確認した。したがって現時点の分類は `history-only drift` ではなく、`migration history drift + partial schema drift` とする。

## input files read

- `AGENTS.md`
- `docs/product/current-status.md`
- `docs/product/dev.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/templates/report-template.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/mission.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/db-inspector.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
- `supabase/migrations/20260322163000_make_activity_logs_occurred_at_nullable.sql`
- `supabase/migrations/20260322193000_update_activity_logs_acquisition_method_check.sql`
- `supabase/migrations/20260324120000_add_pavilions_master.sql`
- `supabase/migrations/20260328120000_add_pavilion_aliases.sql`
- `supabase/migrations/20260404235000_add_auth_to_visit_sessions_and_activity_logs.sql`
- `supabase/migrations/20260405001000_fix_profiles_add_nickname_column.sql`
- `supabase/migrations/20260405003000_add_profiles.sql`
- `supabase/migrations/20260405012000_unify_profiles_display_name.sql`
- `supabase/migrations/20260405190000_add_activity_log_photo_path.sql`
- `supabase/migrations/20260508100000_fix_visit_sessions_and_activity_logs_rls.sql`

## output files changed

- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md`

## commands run

```powershell
git status --short
Test-Path supabase\config.toml
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
npx supabase --version
npx supabase migration list
rg -n "create table|alter table|create policy|policy|enable row level security|create trigger|create function|create or replace function|create index|references" supabase/migrations
npx.cmd supabase --version
npx.cmd supabase migration list
npx.cmd supabase db --help
npx.cmd supabase db query --help
Get-Content -LiteralPath <migration file> -Encoding UTF8
rg -n "areas|countries|events|spots|image_path|read_all|storage" .
```

`npx supabase --version` と `npx supabase migration list` は PowerShell の script execution policy により `npx.ps1` が実行できず失敗した。その後、Windows の `npx.cmd` を使い、read-only CLI 確認を実行した。

`npx.cmd supabase --version` と `npx.cmd supabase migration list` は sandbox 内では npm registry / cache access が `EACCES` で失敗したため、承認済み escalation により実行した。

## read-only SQL run

すべて `npx.cmd supabase db query --linked --output json "<SELECT ...>"` で実行した。DB write、migration repair、`db push`、destructive SQL は実行していない。

```sql
select schema_name
from information_schema.schemata
where schema_name in ('supabase_migrations', 'auth', 'realtime', 'storage')
order by schema_name;
```

```sql
select table_schema, table_name
from information_schema.tables
where table_name ilike '%migration%'
order by table_schema, table_name;
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
where schemaname = 'public'
order by tablename, policyname;
```

```sql
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation, action_statement
from information_schema.triggers
where event_object_schema = 'public'
order by event_object_table, trigger_name;
```

追加の read-only 照合として、public function 一覧、public index 一覧、public constraint 一覧、`storage.buckets`、`storage.objects` policies、`auth.schema_migrations` version 一覧も確認した。

## repo migrations observed

| migration | repo expectation |
| --- | --- |
| `20260322163000_make_activity_logs_occurred_at_nullable.sql` | `activity_logs.occurred_at` を nullable にする |
| `20260322193000_update_activity_logs_acquisition_method_check.sql` | `activity_logs_acquisition_method_check` を `purchase` / `exchange` / `gift` / `other` 許可へ更新 |
| `20260324120000_add_pavilions_master.sql` | `pavilions` table、`activity_logs.pavilion_id`、FK、index、既存 log から pavilion seed / backfill |
| `20260328120000_add_pavilion_aliases.sql` | `pavilion_aliases` table、index、`(pavilion_id, alias)` unique |
| `20260404235000_add_auth_to_visit_sessions_and_activity_logs.sql` | `visit_sessions.user_id`、`activity_logs.user_id`、index、user_id 同期 function / trigger、RLS、own policies |
| `20260405001000_fix_profiles_add_nickname_column.sql` | `profiles.nickname`、`created_at`、`updated_at` を追加 |
| `20260405003000_add_profiles.sql` | `profiles` table、updated_at trigger、RLS、profiles own policies |
| `20260405012000_unify_profiles_display_name.sql` | `profiles.display_name` を追加し、`nickname` から移行後に `nickname` を削除 |
| `20260405190000_add_activity_log_photo_path.sql` | `activity_logs.photo_path`、`activity-photos` bucket、storage object policies |
| `20260508100000_fix_visit_sessions_and_activity_logs_rls.sql` | dev insert policy を削除し、insert own policy を `authenticated` に限定 |

## remote migration history observed

- Supabase CLI version: `2.98.2`
- `supabase/config.toml`: not found
- `npx.cmd supabase migration list`: local 10 migration が表示され、remote 列はすべて空
- `supabase_migrations` schema: not found
- migration 関連 table: `auth.schema_migrations`、`realtime.schema_migrations`、`storage.migrations`
- `auth.schema_migrations` の version は Supabase 内部 migration と見られ、repo migration version とは一致しない

## remote schema observed

public tables:

- `activity_logs`
- `areas`
- `countries`
- `events`
- `pavilion_aliases`
- `pavilions`
- `profiles`
- `spots`
- `visit_sessions`

repo migration と一致または概ね一致する主な evidence:

- `activity_logs.occurred_at` は nullable
- `activity_logs.pavilion_id`、`activity_logs.user_id`、`activity_logs.photo_path` は存在
- `pavilions`、`pavilion_aliases`、`profiles` は存在
- `profiles.display_name` は存在し、`profiles.nickname` は存在しない
- `activity-photos` storage bucket は存在し、public は `true`
- `activity_logs_acquisition_method_check`、`activity_logs_pavilion_id_fkey`、`activity_logs_user_id_fkey`、`pavilion_aliases_pavilion_id_alias_key`、`profiles_id_fkey` は存在

remote にだけ見える主な要素:

- `events`、`areas`、`countries`、`spots`
- `pavilions.image_path`
- `visit_sessions_user_id_event_id_visit_date_key`
- `visit_sessions_visit_date_key`
- `areas_read_all_anon`、`areas_read_all_authenticated`、`countries_read_all_authenticated`、`events_read_all_public`、`spots_read_all_authenticated`

repo expectation に対して remote に見えない主な要素:

- `public.assign_visit_session_user_id`
- `public.sync_activity_log_user_id`
- `set_visit_session_user_id` trigger
- `set_activity_log_user_id` trigger
- `visit_sessions_user_id_visit_date_idx`
- `activity_logs_user_id_session_id_idx`

## RLS / policy / trigger / function observed

RLS:

| table | remote RLS |
| --- | --- |
| `activity_logs` | enabled |
| `areas` | enabled |
| `countries` | enabled |
| `events` | enabled |
| `pavilion_aliases` | disabled |
| `pavilions` | disabled |
| `profiles` | enabled |
| `spots` | enabled |
| `visit_sessions` | enabled |

public policies:

- `activity_logs`: `select_own` / `insert_own` / `update_own` / `delete_own`
- `visit_sessions`: `select_own` / `insert_own` / `update_own` / `delete_own`
- `profiles`: `select_own` / `insert_own` / `update_own`
- `areas`: read-all policies for `anon` and `authenticated`
- `countries`: read-all policy for `authenticated`
- `events`: read-all policy for `anon,authenticated`
- `spots`: read-all policy for `authenticated`

`activity_logs_insert_own` と `visit_sessions_insert_own` は `roles = {authenticated}` で、latest repo migration の意図と一致する。

triggers:

- observed: `profiles.set_profiles_updated_at`
- missing vs repo expectation: `visit_sessions.set_visit_session_user_id`、`activity_logs.set_activity_log_user_id`

functions:

- observed: `public.set_profiles_updated_at`
- missing vs repo expectation: `public.assign_visit_session_user_id`、`public.sync_activity_log_user_id`

storage:

- `storage.buckets`: `activity-photos` exists, public `true`
- `storage.objects` policies:
  - `activity_photos_delete_own`
  - `activity_photos_insert_test`
  - `activity_photos_update_own`
- repo expectation では insert policy は `activity_photos_insert_own` で、path check も `(storage.foldername(name))[1] = auth.uid()::text`。remote の insert policy は `activity_photos_insert_test` で `bucket_id = 'activity-photos'` のみなので drift。

## drift summary

| area | status | notes |
| --- | --- | --- |
| remote migration history | drift | remote 列が空。`supabase_migrations` schema なし |
| public table / column | partial match | repo 後半 migration の主要 table / column は多く存在 |
| public extra schema | drift / unknown origin | `events`、`areas`、`countries`、`spots`、`pavilions.image_path` は repo migration 外 |
| RLS / public policies | partial match | own policies は概ね存在。latest insert policy は `authenticated`。remote-only read-all policies あり |
| public triggers / functions | drift | `assign_visit_session_user_id`、`sync_activity_log_user_id` と対応 trigger が remote にない |
| storage bucket | match | `activity-photos` exists, public true |
| storage policies | drift | insert policy name / condition が repo と異なる |
| indexes | partial drift | repo の user_id 系 index 2 本が見えない。remote-only unique index あり |

分類:

- `history-only drift`: no
- `schema drift`: yes
- `unknown`: some remote-only schema の由来
- `wrong project suspected`: no strong evidence, but final target environment confirmation remains required
- `tooling / link issue suspected`: possible only for migration history visibility; schema query itselfは成功

## repo migration vs remote schema comparison

| migration | target | repo expectation | remote observed | status | notes |
| --- | --- | --- | --- | --- | --- |
| `20260322163000` | `activity_logs.occurred_at` | nullable | nullable | match | |
| `20260322193000` | `activity_logs_acquisition_method_check` | exists | exists | match | definition textまでは未比較 |
| `20260324120000` | `pavilions` | table / columns / pkey / name unique / sort index | exists | match | `image_path` は remote-only |
| `20260324120000` | `activity_logs.pavilion_id` | column / FK / index | exists | match | |
| `20260328120000` | `pavilion_aliases` | table / FK / indexes / unique | exists | match | |
| `20260404235000` | auth user columns | `visit_sessions.user_id` / `activity_logs.user_id` | exists nullable | partial match | repo の not null は data condition 付きのため nullable 自体は即 drift とは断定しない |
| `20260404235000` | auth indexes | `visit_sessions_user_id_visit_date_idx` / `activity_logs_user_id_session_id_idx` | not observed | drift | |
| `20260404235000` | user sync functions / triggers | 2 functions + 2 triggers | not observed | drift | app 側の user_id セット前提に寄っている可能性 |
| `20260404235000` | own policies | select / insert / update / delete | exists | match | insert role は latest migration で上書き済み |
| `20260405001000` | `profiles.nickname` | add column | later dropped | not applicable | final repo stateでは不要 |
| `20260405003000` | `profiles` | table / trigger / RLS / policies | exists | match | |
| `20260405012000` | `profiles.display_name` / `nickname` | display_name exists, nickname dropped | match | match | |
| `20260405190000` | `activity_logs.photo_path` | exists | exists | match | |
| `20260405190000` | storage bucket | `activity-photos` public | exists public true | match | |
| `20260405190000` | storage policies | insert/update/delete own | update/delete similar, insert differs | drift | remote insert policy is `activity_photos_insert_test` |
| `20260508100000` | insert own policies | dev insert policies removed; insert own to authenticated | observed authenticated | match | dev policy absenceはpolicy一覧から確認 |

## repair candidate table

`migration repair` は remote migration history table への write を伴うため、Human approval gate 前には実行しない。現時点では schema drift が残っているため、全 migration を即 `applied` 登録することは推奨しない。

| version | migration file | remote schema evidence | proposed status | risk | notes |
| --- | --- | --- | --- | --- | --- |
| `20260322163000` | `make_activity_logs_occurred_at_nullable.sql` | `occurred_at` nullable | candidate after review | low | |
| `20260322193000` | `update_activity_logs_acquisition_method_check.sql` | check constraint exists | candidate after definition check | low | constraint definition comparisonが未完 |
| `20260324120000` | `add_pavilions_master.sql` | table / column / FK / index exists | candidate after review | low | remote-only `image_path` は別由来 |
| `20260328120000` | `add_pavilion_aliases.sql` | table / FK / indexes / unique exists | candidate after review | low | |
| `20260404235000` | `add_auth_to_visit_sessions_and_activity_logs.sql` | user_id columns / policies exist, but functions / triggers / indexes missing | not ready | high | repair 前に schema drift 判断が必要 |
| `20260405001000` | `fix_profiles_add_nickname_column.sql` | final stateでは `nickname` removed | candidate only with sequence-aware review | medium | 単体では remote final state と一致しない |
| `20260405003000` | `add_profiles.sql` | profiles / trigger / RLS / policies exist | candidate after review | low | |
| `20260405012000` | `unify_profiles_display_name.sql` | display_name exists, nickname absent | candidate after review | low | |
| `20260405190000` | `add_activity_log_photo_path.sql` | photo_path / bucket exists, storage insert policy differs | not ready | high | storage policy drift |
| `20260508100000` | `fix_visit_sessions_and_activity_logs_rls.sql` | insert policies are `authenticated` | candidate after broader drift resolution | medium | depends on previous RLS migration handling |

## `db push` judgment

現時点で `npx.cmd supabase db push` は実行不可、かつ推奨不可。

理由:

- remote migration history が空に見える。
- `supabase_migrations` schema が remote に見えない。
- CLI は local の 10 migration すべてを remote 未適用として扱う可能性が高い。
- schema drift があり、全 migration を単純適用すると既存 schema / policy と衝突または意図しない上書きになる可能性がある。
- `db push` は production DB write であり、Human approval gate が必要。

## individual SQL judgment

個別 SQL 適用は現時点では未承認かつ未実行。

候補になりうる対象:

- 欠落している `public.assign_visit_session_user_id` / `public.sync_activity_log_user_id` と trigger を repo migration どおり再作成するか。
- 欠落している user_id 系 index を作成するか。
- storage insert policy `activity_photos_insert_test` を repo expectation に合わせて `activity_photos_insert_own` 相当に修正するか。

ただし、remote-only schema と現行アプリコードの前提があるため、個別 SQL は次の追加確認後に限定 SQL と rollback を作るべき。

- なぜ trigger / function が remote に存在しないのか。
- 現行アプリが `user_id` を client / server action 側で必ず設定しているか。
- `activity_photos_insert_test` が一時検証用として残っているのか、現行運用上必要なのか。
- remote-only schema を正式 schema として repo migration に取り込む予定があるか。

## risks

- migration history が空のまま `db push` すると、local 全 migration の再適用扱いになりうる。
- `migration repair` を先に実行すると、schema drift を履歴上の整合に見せてしまう可能性がある。
- user_id 同期 trigger / function がないため、アプリ側が user_id を設定しない経路がある場合は insert / update が RLS または整合性で失敗する可能性がある。
- storage insert policy が repo expectation より広く見えるため、`activity-photos` bucket 内の path 制約が弱い可能性がある。
- remote-only schema の由来が repo migration で追跡できないため、今後の migration 正常化時に reverse drift が起きる可能性がある。
- `supabase/config.toml` がなく、link 状態は CLI profile / local Supabase state に依存している。

## rollback

- rollback needed for this task: no
- reason: 今回は read-only 調査と docs report 作成のみで、DB write は実行していない。

将来の候補操作ごとの rollback 方針:

| operation | rollback type | rollback plan |
| --- | --- | --- |
| `migration repair --status applied <version>` | forward fix / support-assisted | migration history write の取り消しは慎重に扱う。誤 repair 時は対象 version を `reverted` に repair する案を作るが、実行前に Supabase CLI の current behavior を再確認する |
| recreate missing functions / triggers | simple SQL rollback | `drop trigger if exists ...` と `drop function if exists ...` を rollback SQL として用意する |
| create missing indexes | simple SQL rollback | `drop index concurrently if exists ...` 相当。ただし transaction / lock 方針を事前確認する |
| storage policy修正 | simple SQL rollback / forward fix | 既存 policy 名と条件を事前保存し、`drop policy` / `create policy` で戻す。ただし policy gap が出ない順序を設計する |
| `db push` | not safely reversible | 適用内容が複数 migration にまたがるため、事前 backup と個別 rollback SQL がない限り実行しない |

## unknowns

- linked project が Bloomlog production であることの最終確認。
- remote-only schema (`events`、`areas`、`countries`、`spots`、`pavilions.image_path`) の作成経路。
- `public.assign_visit_session_user_id` / `public.sync_activity_log_user_id` と trigger が remote にない理由。
- user_id 系 index が remote にない理由。
- `activity_photos_insert_test` が意図的な現行 policy か、一時検証の残りか。
- `activity_logs_acquisition_method_check` の定義が repo と完全一致しているか。
- remote migration history を Supabase CLI がどう初期化 / repair するのが現在の推奨か。

## approval required?

yes, if moving beyond read-only investigation.

この task 自体で実行した操作は read-only と docs 作成のみなので、今回の report 作成には Human approval は不要。ただし次の操作は approval gate が必要。

- migration repair
- `db push`
- production DB write
- destructive SQL
- dashboard setting change

## approval reason

- approval type: migration repair / db push / production write / destructive SQL
- reason: いずれも remote DB への write または production 影響を伴うため。
- approval-needed file: `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`

現時点では `approval-needed.md` の exact command / SQL は未更新。schema drift が残るため、即時実行可能な approval request ではなく、次の Parent / Reviewer / QA 統合後に候補を絞るべき。

## validation

- validation performed: repo migration 一覧、CLI version、remote migration list、remote schema / RLS / policy / trigger / function / index / constraint / storage の read-only SQL。
- validation result: remote migration history は空表示。schema は一部 match、一部 drift。
- validation not performed: DB write、migration repair、`db push`、destructive SQL、dashboard 確認、constraint definition の全文比較、function definition の全文比較。
- reason: task scope が read-only であり、write 操作は禁止。全文比較は次 task で必要に応じて追加する。

## diff summary

- changed files:
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md`
- docs-only: yes
- code change: no
- DB write: no
- `supabase/migrations/` changed: no
- approval gate candidate: yes, for future DB write candidates only

## next action

- Reviewer Agent がこの report の drift 判定、docs-only safe path、approval gate 判定を確認する。
- QA Agent が実行コマンドと read-only SQL 結果の整合を確認する。
- Parent Agent が `approval-needed.md` を更新するか判断する。
- すぐに `db push` へ進まない。
- `migration repair` は、missing functions / triggers / indexes / storage policy drift と remote-only schema の扱いを整理してから候補化する。
