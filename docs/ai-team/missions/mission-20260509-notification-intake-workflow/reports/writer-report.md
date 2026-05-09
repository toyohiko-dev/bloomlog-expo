# Writer Report: Gmail Notification Intake Workflow

## mission id

`mission-20260509-notification-intake-workflow`

## task id

`task-002-workflow-design`

## agent role

- Writer Agent

## summary

Gmail に届く Supabase 通知を起点に、将来 Vercel / GitHub 通知へ拡張できる provider-neutral な intake workflow を設計した。

Bloomlog app 本体への Gmail 連携組み込みは非目的として明記し、通知の取得、正規化、分類、repo 照合、decision package、approval gate を分離した。

## proposed mission state

- proposed status: completed
- reason: docs-only workflow design が完了したため
- required Parent action: diff と safe path を確認し、commit / push する

## input files read

- `AGENTS.md`
- `docs/ai-team/notification-review-policy.md`
- `docs/ai-team/notification-review-prompt.md`
- `docs/ai-team/notification-review-status.md`
- `docs/ai-team/notification-review-log.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/supabase-migration-ops.md`

## output files changed

- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/mission.md`
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/decision-log.md`
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/tasks/parent.md`
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/tasks/writer.md`
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/tasks/reviewer.md`
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/tasks/qa.md`

## commands run

```powershell
New-Item -ItemType Directory -Force docs\ai-team\missions\mission-20260509-notification-intake-workflow\tasks, docs\ai-team\missions\mission-20260509-notification-intake-workflow\reports
```

## validation

- validation performed: content self-check against AGENTS.md and existing notification review docs
- validation result: passed
- validation not performed: actual Gmail notification fetch
- reason: this Mission is docs-only workflow design; real notification pilot is next bounded action

## diff summary

- changed files: Mission artifacts under `docs/ai-team/missions/mission-20260509-notification-intake-workflow/`
- diff stat: see QA / Parent report
- docs-only: yes
- code change: no
- approval gate candidate: no

## risks

- 実際の Gmail 連携の権限、検索条件、取得できるメタ情報は未検証。
- Supabase / Vercel / GitHub の実通知には provider-specific な分類項目が追加で必要になる可能性がある。

## rollback

- rollback needed: no
- rollback plan: docs-only 変更のため、必要ならこの Mission directory の revert で戻せる。
- rollback not needed because: production behavior、DB、secret、dashboard に影響しない。

## unknowns

- Gmail 連携で AI が取得可能な検索フィールド。
- 実通知の量、重複、スレッド構造。
- Supabase 通知の種類ごとの分類精度。

## approval required?

no

## approval reason

- approval type: none
- reason: docs-only workflow design のため
- approval-needed file: none

## next action

- 実 Supabase Gmail 通知を read-only で pilot review し、sanitized summary だけを記録する。
