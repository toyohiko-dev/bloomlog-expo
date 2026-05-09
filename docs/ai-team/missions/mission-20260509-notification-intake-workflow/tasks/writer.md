# Task: Workflow Design

## task id

`task-002-workflow-design`

## mission id

`mission-20260509-notification-intake-workflow`

## assigned agent

- Writer Agent

## input files

- `AGENTS.md`
- `docs/ai-team/notification-review-policy.md`
- `docs/ai-team/notification-review-prompt.md`
- `docs/ai-team/notification-review-status.md`
- `docs/ai-team/notification-review-log.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/supabase-migration-ops.md`

## target files / target area

- `mission.md`
- `decision-log.md`
- `reports/writer-report.md`

## allowed operations

- read docs
- create docs
- create report

## prohibited operations

- app code、lib、supabase、migrations、package、env の変更。
- Gmail API、Apps Script、webhook、cron の追加。
- Bloomlog app 本体への Gmail 連携組み込み。
- secret / token / メール本文全文の保存。
- DB write、db push、migration repair。
- dashboard 変更。

## expected output

- Gmail Supabase 通知を起点にした workflow。
- Vercel / GitHub に拡張できる provider-neutral 分類軸。
- action class と approval gate。
- repo / docs / migrations / config 照合手順。

## completion criteria

- workflow が Mission に記載されている。
- 保存してよい情報、保存しない情報が明確である。
- Human approval gate が明確である。

## human intervention required?

no

## if yes, why

- approval type: none
- reason: docs-only design のため
- approval-needed file: none
