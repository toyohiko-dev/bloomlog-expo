# Parent Task: Mission 統合

## task id

`task-001-parent-integration`

## mission id

`mission-20260509-supabase-migration-history`

## assigned agent

- Parent Agent

## input files

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/current-status.md`
- `docs/product/dev.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-docs-map.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/mission.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/db-inspector.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/reviewer.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/qa.md`

## target files / target area

- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/parent-summary.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`

## allowed operations

- read docs / code
- inspect diff
- run validation commands
- create report
- update Mission docs under this Mission directory

## prohibited operations

- Human を Agent 間通信路にすること。
- Sakura を Agent 間通信路にすること。
- secret / token / メール本文全文の保存。
- DB write。
- migration repair。
- db push。
- archive 移動。
- ファイル削除。
- approval gate なしの production write。

## commands allowed

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --cached --name-only
git diff --cached --stat
rg "<pattern>"
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
npx supabase --version
npx supabase migration list
```

## commands prohibited

```powershell
npx supabase db push
npx supabase migration repair
```

加えて、destructive SQL、secret 変更、dashboard 変更、production write は Human approval gate なしに実行しない。

## expected output

- Agent reports を統合した `reports/parent-summary.md`。
- 実行可否判断を残す `decision-log.md` の追記。
- write 候補がある場合の `approval-needed.md` 更新。
- 次に起動すべき Agent と task file path の明示。

## completion criteria

- DB Inspector / Reviewer / QA の report を読んで統合している。
- approval gate の要否が明確である。
- `db push`、`migration repair`、個別 SQL 適用の候補と禁止範囲が整理されている。
- Human に転記や diff 確認を依頼していない。

## human intervention required?

yes

## if yes, why

- approval type: migration repair / db push / production write / destructive SQL
- reason: read-only 調査後に write 操作が必要と判断された場合のみ Human approval gate に入るため。
- approval-needed file: `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
