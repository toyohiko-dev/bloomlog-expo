# Task: Parent Integration

## task id

`task-001-parent-integration`

## mission id

`mission-20260509-notification-intake-ops-reframe`

## assigned agent

- Parent Agent

## input files

- `AGENTS.md`
- `docs/ai-team/mission-lifecycle.md`
- `docs/ai-team/notification-review-log.md`
- `docs/ai-team/notification-review-policy.md`
- `docs/ai-team/notification-review-status.md`
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/mission.md`
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/decision-log.md`
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/reports/parent-summary.md`

## target files / target area

- `docs/ai-team/ops/notification-intake/`
- `docs/ai-team/notification-review-log.md`
- `docs/ai-team/missions/mission-20260509-notification-intake-ops-reframe/`

## allowed operations

- read docs
- create docs
- edit docs
- inspect diff
- run validation commands
- create report
- commit / push after docs-only safe path verification

## prohibited operations

- app / lib / supabase / migrations / package / env の変更。
- secret / token / メール本文全文の保存。
- DB write。
- migration repair。
- db push。
- dashboard 変更。
- Gmail API、Apps Script、webhook、cron の追加。

## expected output

- Ops docs の最小構成。
- sanitized queue entries。
- Ops と Mission の分離方針。
- Reviewer / QA 観点。
- docs-only commit / push。

## completion criteria

- docs-only safe path yes。
- queue に Sakura pilot の sanitized entries がある。
- follow-up action が明確。

## human intervention required?

no
