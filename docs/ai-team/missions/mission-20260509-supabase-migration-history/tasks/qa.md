# QA Task: validation 設計と整合確認

## task id

`task-004-qa-validation-design`

## mission id

`mission-20260509-supabase-migration-history`

## assigned agent

- QA Agent

## input files

- `AGENTS.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/mission.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/db-inspector.md`
- relevant reports under `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/`

## target files / target area

- validation plan for read-only investigation
- report consistency
- output: `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/qa-report.md`

## allowed operations

- read docs / code
- inspect diff
- run validation commands
- create report
- run read-only CLI checks

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

`reports/qa-report.md` に次を書く。

- commands run。
- validation results。
- skipped validation and reason。
- DB Inspector report が required fields を満たすか。
- approval-needed が exact command / SQL / risk / rollback / verification を含むか。
- residual risk。
- next action。

## completion criteria

- docs-only diff の検証が完了している。
- read-only 調査コマンドの実行可否が整理されている。
- DB Inspector report の不足項目があれば指摘している。
- Human に目視確認や転記を依頼していない。

## human intervention required?

no

## if yes, why

- approval type: none
- reason: QA validation 自体は read-only / docs-only のため Human approval gate ではない。
- approval-needed file: `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
