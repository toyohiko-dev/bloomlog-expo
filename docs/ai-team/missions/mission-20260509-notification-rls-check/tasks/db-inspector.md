# Task: DB Inspector Read-only Check

## task id

`task-001-db-inspector`

## mission id

`mission-20260509-notification-rls-check`

## assigned agent

- DB Inspector Agent

## input files

- `AGENTS.md`
- `docs/ai-team/mission-lifecycle.md`
- `docs/ai-team/ops/notification-intake/queue.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/supabase-rls-remediation-checklist.md`
- `supabase/migrations/`

## target files / target area

- `docs/ai-team/missions/mission-20260509-notification-rls-check/reports/db-inspector-report.md`
- `docs/ai-team/missions/mission-20260509-notification-rls-check/approval-needed.md` only if gated operation becomes necessary

## allowed operations

- read docs / code
- inspect migration files
- run validation commands
- run read-only SQL
- create report

## prohibited operations

- Human を Agent 間通信路にすること。
- secret / token / メール本文全文の保存。
- DB write。
- migration repair。
- db push。
- destructive SQL。
- dashboard 変更。
- credential / env 変更。
- migration 作成。

## commands allowed

```powershell
git status --short
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
npx supabase --version
npx supabase migration list
```

Read-only SQL only.

## commands prohibited

```powershell
npx supabase db push
npx supabase migration repair
```

加えて、`insert / update / delete / create / alter / drop` SQL、dashboard 変更、credential 変更、production write は Human approval gate なしに実行しない。

## expected output

- RLS status table。
- policy list summary。
- sensitive columns exposure assessment。
- migration history visibility。
- repo migration vs remote state judgment。
- approval gate required yes / no。
- next action。

## completion criteria

- current state が read-only で確認されている。
- unresolved issue / historical resolved / unknown のどれかに分類されている。
- write 候補がある場合は approval-needed 案がある。

## human intervention required?

no for read-only investigation.

## if yes, why

- approval type: DB / dashboard / db push / migration repair / production write only if needed after read-only inspection
- reason: gated operation
- approval-needed file: create if needed
