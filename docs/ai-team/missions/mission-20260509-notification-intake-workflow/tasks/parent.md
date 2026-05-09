# Task: Parent Integration

## task id

`task-001-parent-integration`

## mission id

`mission-20260509-notification-intake-workflow`

## assigned agent

- Parent Agent

## input files

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/current-status.md`
- `docs/product/dev.md`
- `docs/ai-team/mission-lifecycle.md`
- `docs/ai-team/agent-docs-map.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/notification-review-policy.md`
- `docs/ai-team/notification-review-prompt.md`
- `docs/ai-team/notification-review-status.md`
- `docs/ai-team/notification-review-log.md`
- `docs/ai-team/supabase-migration-ops.md`

## target files / target area

- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/`

## allowed operations

- read docs
- create docs
- inspect diff
- run validation commands
- create report
- commit / push after docs-only safe path verification

## prohibited operations

- Human を Agent 間通信路にすること。
- secret / token / メール本文全文の保存。
- DB write。
- migration repair。
- db push。
- archive 移動。
- ファイル削除。
- approval gate なしの production write。
- Gmail API、Apps Script、webhook、cron の追加。
- Bloomlog app 本体への Gmail 連携組み込み。

## commands allowed

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --cached --name-only
git diff --cached --stat
rg "<pattern>"
```

## commands prohibited

```powershell
npx supabase db push
npx supabase migration repair
```

加えて、destructive SQL、secret 変更、dashboard 変更、production write は Human approval gate なしに実行しない。

## expected output

- Mission definition
- Decision log
- Workflow definition
- Writer / Reviewer / QA reports
- Parent summary
- docs-only safe path verification

## completion criteria

- Mission artifacts が作成されている。
- workflow と approval gate が定義されている。
- docs-only safe path が yes と確認されている。
- commit / push が完了している。

## human intervention required?

no

## if yes, why

- approval type: none
- reason: docs-only safe path のため
- approval-needed file: none
