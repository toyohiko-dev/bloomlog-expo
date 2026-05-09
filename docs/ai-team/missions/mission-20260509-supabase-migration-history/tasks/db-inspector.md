# DB Inspector Task: read-only 棚卸し

## task id

`task-002-db-inspector-read-only-inventory`

## mission id

`mission-20260509-supabase-migration-history`

## assigned agent

- DB Inspector Agent

## input files

- `AGENTS.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/templates/report-template.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/mission.md`
- `supabase/migrations/`

## target files / target area

- `supabase/migrations/` read-only
- remote migration history read-only
- remote schema / RLS / policy / trigger / function read-only
- output: `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md`

## allowed operations

- read docs / code
- inspect repo migration files
- run read-only CLI checks
- run read-only SQL
- create report
- prepare approval-needed candidate text

## prohibited operations

- Human を Agent 間通信路にすること。
- Sakura を Agent 間通信路にすること。
- secret / token / メール本文全文の保存。
- DB write。
- migration repair。
- db push。
- destructive SQL。
- archive 移動。
- ファイル削除。
- approval gate なしの production write。
- `supabase/migrations/` の変更。

## commands allowed

```powershell
git status --short
Test-Path supabase\config.toml
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
npx supabase --version
npx supabase migration list
```

read-only SQL only:

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

## commands prohibited

```powershell
npx supabase db push
npx supabase migration repair
npx supabase db reset
npx supabase db remote commit
```

加えて、`insert`、`update`、`delete`、`create`、`alter`、`drop` を含む SQL、dashboard 変更、secret 変更、production write は Human approval gate なしに実行しない。

## expected output

`reports/db-inspector-report.md` に次を書く。

- mission id / task id / agent role。
- input files read。
- commands run。
- read-only SQL run。
- repo migrations observed。
- remote migration history observed。
- remote schema observed。
- RLS / policy / trigger / function observed。
- drift summary。
- repair candidate table。
- `db push` judgment。
- individual SQL judgment。
- risks。
- rollback。
- unknowns。
- approval required。
- next action。

## completion criteria

- remote migration history が空 / 欠落 / 読めないだけのどれに近いか分類している。
- repo migration と remote schema の照合表がある。
- `migration repair` 候補表がある。
- `db push` 可否判断がある。
- write 候補がある場合は `approval-needed.md` に転記できる粒度で exact command / SQL 案、risk、rollback、verification を書いている。

## human intervention required?

yes

## if yes, why

- approval type: migration repair / db push / production write / destructive SQL
- reason: DB Inspector は read-only まで実行する。write 操作が必要な場合は Human approval gate で止める。
- approval-needed file: `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
