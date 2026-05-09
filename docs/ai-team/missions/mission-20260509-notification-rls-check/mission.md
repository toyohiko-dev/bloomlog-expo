# Mission: Notification RLS Check

作成日: 2026-05-09

```yaml
status: completed
owner_role: Parent Agent
current_phase: finalization
selected_option: classify NTF-20260509-01 as historical/resolved for owner data tables; no gated remediation now
approval_required: no
approval_status: not-required
execution_status: completed
verification_status: partial
residual_risk: exact Supabase Advisor target is unavailable from sanitized email; full public table sweep was blocked by temporary Supabase auth circuit breaker
next_action: If the Supabase Advisor alert persists, create a new queue entry with sanitized target category and run a narrower read-only follow-up
last_updated: 2026-05-09
```

## 目的

Notification Intake Queue の `NTF-20260509-01` を受け、Supabase の RLS / policy 状態について、現在も対応が必要かを read-only で確認する。

対象は、RLS disabled または sensitive columns exposed の警告に対して、repo docs、migrations、remote DB の現状が整合しているかを確認すること。

## 背景

Sakura / ChatGPT の Gmail read-only pilot で、Supabase の security alert が sanitized entry として queue に追加された。

既存 docs には、過去に `visit_sessions` と `activity_logs` の RLS 修正が個別適用済みであること、また remote migration history が空または欠落している可能性が高く `db push` を標準手段にしないことが記録されている。

今回の Mission では、最新 alert が既知の resolved issue なのか、未解決の DB / RLS / policy / sensitive column 問題なのかを read-only で切り分ける。

## 成功条件

- `NTF-20260509-01` の queue context を読んでいる。
- repo migration と既存 DB docs を確認している。
- remote DB の RLS / policy / sensitive column 関連状態を read-only で確認する計画がある。
- write、dashboard 変更、`db push`、migration repair が必要な場合は approval-needed を作成して停止する方針が明確である。
- Human をメール本文転記係、SQL 組み立て係、dashboard 目視係にしない。

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
- DB write は行わない。
- destructive SQL は行わない。
- `db push` は行わない。
- migration repair は行わない。
- Gmail 本文取得や raw body 保存は行わない。

## path type

- DB / migration path

## required agents

- Parent Agent
- DB Inspector Agent
- Reviewer Agent
- QA Agent

## approval gates

- approval required: no for read-only investigation
- approval type: none for this initial read-only phase
- approval reason: read-only inspection only

Human approval が必要になる条件:

- production DB write が必要。
- destructive SQL が必要。
- `db push` が必要。
- migration repair が必要。
- migration apply が必要。
- Supabase dashboard 変更が必要。
- credential / env 変更が必要。

## source

- `docs/ai-team/ops/notification-intake/queue.md#NTF-20260509-01`

## expected outputs

- `tasks/db-inspector.md`
- `reports/db-inspector-report.md`
- `reports/reviewer-report.md`
- `reports/qa-report.md`
- `reports/parent-summary.md`

## initial read-only checks

DB Inspector Agent should start with:

```powershell
git status --short
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
npx supabase --version
npx supabase migration list
```

Read-only SQL targets:

- public table RLS status.
- policy list for `visit_sessions`, `activity_logs`, `profiles`, `pavilions`, `pavilion_aliases`.
- storage policies for `activity-photos` if security alert may include storage exposure.
- sensitive columns that contain user identifiers, profile names, photo paths, or session ownership fields.
- remote migration history visibility.

禁止:

- `insert / update / delete / create / alter / drop` SQL。
- dashboard 変更。
- `db push`。
- migration repair。

## replaced duplicate draft

Codex created a local draft Mission path while processing the queue:

- `docs/ai-team/missions/mission-20260509-supabase-security-alert-readonly/`

That draft is not adopted as a new Mission. This `mission-20260509-notification-rls-check` directory is the canonical Mission. Useful details from the draft have been integrated here, in `tasks/db-inspector.md`, and in `reports/parent-summary.md`.

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- dashboard URL、project ID、内部 ID を保存しない。
