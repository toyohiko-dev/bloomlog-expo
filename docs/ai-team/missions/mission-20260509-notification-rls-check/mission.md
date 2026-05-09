# Mission: Notification RLS Check

作成日: 2026-05-09

```yaml
status: active
owner_role: Parent Agent
current_phase: mission
selected_option: read-only follow-up
approval_required: no
approval_status: not-required
execution_status: not-started
verification_status: not-started
residual_risk: current remote state is not yet verified
next_action: Prepare a read-only DB Inspector task
last_updated: 2026-05-09
```

## 目的

Notification Intake Queue の `NTF-20260509-01` を受け、Supabase の RLS / policy 状態について、現在も対応が必要かを read-only で確認する。

## scope

- queue entry の sanitized summary を起点にする。
- repo docs、migration、既存 reports を確認する。
- DB Inspector Agent が read-only の現状確認 task を行う。
- 必要なら別途 approval package を作る。

## non-goals

- app code は変更しない。
- `lib/` は変更しない。
- `supabase/` は変更しない。
- migrations は変更しない。
- package / env は変更しない。
- production setting は変更しない。

## source

- `docs/ai-team/ops/notification-intake/queue.md#NTF-20260509-01`

## expected outputs

- `tasks/db-inspector.md`
- `reports/db-inspector-report.md`
- `reports/reviewer-report.md`
- `reports/qa-report.md`
- `reports/parent-summary.md`
