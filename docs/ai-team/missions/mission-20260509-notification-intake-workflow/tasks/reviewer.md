# Task: Docs-only Review

## task id

`task-003-reviewer`

## mission id

`mission-20260509-notification-intake-workflow`

## assigned agent

- Reviewer Agent

## input files

- `AGENTS.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-docs-map.md`
- Mission artifacts in `docs/ai-team/missions/mission-20260509-notification-intake-workflow/`

## target files / target area

- `reports/reviewer-report.md`

## allowed operations

- read docs
- inspect diff
- create report

## prohibited operations

- app code、lib、supabase、migrations、package、env の変更。
- archive 移動。
- ファイル削除。
- secret / token / メール本文全文の保存。
- DB write、db push、migration repair。

## expected output

- docs-only safe path の確認。
- approval gate の漏れ確認。
- Gmail 連携を Bloomlog app 本体へ組み込んでいないことの確認。
- secret / メール本文保存禁止の確認。

## completion criteria

- docs-only safe path yes / no が Report にある。
- code / DB / secret / dashboard 影響が Report にある。
- push を止める条件に該当しないことが確認されている。

## human intervention required?

no

## if yes, why

- approval type: none
- reason: docs-only review のため
- approval-needed file: none
