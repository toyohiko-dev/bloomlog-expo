# Task: QA Validation

## task id

`task-004-qa`

## mission id

`mission-20260509-notification-intake-workflow`

## assigned agent

- QA Agent

## input files

- Mission artifacts in `docs/ai-team/missions/mission-20260509-notification-intake-workflow/`
- `docs/ai-team/agent-review-workflow.md`

## target files / target area

- `reports/qa-report.md`

## allowed operations

- read docs
- inspect diff
- run validation commands
- create report

## prohibited operations

- app code、lib、supabase、migrations、package、env の変更。
- secret / token / メール本文全文の保存。
- DB write、db push、migration repair。
- dashboard 変更。

## commands allowed

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --cached --name-only
git diff --cached --stat
rg "Gmail|Supabase|Vercel|GitHub|approval|db push|migration repair" docs\ai-team\missions\mission-20260509-notification-intake-workflow
```

## expected output

- diff が docs-only であること。
- 禁止対象ファイルが変更されていないこと。
- workflow に action class と approval gate が含まれていること。

## completion criteria

- validation result が passed。
- docs-only safe path yes。
- residual risk が整理されている。

## human intervention required?

no

## if yes, why

- approval type: none
- reason: docs-only validation のため
- approval-needed file: none
