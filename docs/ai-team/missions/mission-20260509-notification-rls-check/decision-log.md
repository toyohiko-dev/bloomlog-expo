# Decision Log: Notification RLS Check

## decision date

2026-05-09

## decision maker

- Parent Agent

## mission id

`mission-20260509-notification-rls-check`

## decision

`NTF-20260509-01` は queue 内完了ではなく、read-only DB Inspector follow-up Mission に切り出す。

Remote に作成済みの `mission-20260509-notification-rls-check` を canonical Mission とする。Codex local draft `mission-20260509-supabase-security-alert-readonly` は新規 Mission として採用せず、必要な詳細だけ canonical Mission に統合した。

Read-only DB Inspector checks completed. The alert is classified as historical/resolved for `visit_sessions`, `activity_logs`, `profiles`, and `activity-photos` storage policy. No gated remediation is proposed.

## state transition

- from: mission active
- to: completed
- changed by: Parent Agent
- reason: owner data tables and storage policy were verified read-only; no DB write / dashboard / credential / db push / migration repair candidate remains
- blocker: none
- unblock condition: none

## alternatives considered

- queue 内で completed にする。
- Codex local draft Mission `mission-20260509-supabase-security-alert-readonly` を採用する。
- すぐ approval-needed を作成する。
- すぐ DB write / dashboard 変更を実行する。

## rationale

- 既存 docs には過去の RLS remediation 済み記録があるが、最新 Supabase alert が同じ対象か別対象かは未確認。
- remote migration history 空問題があるため、`db push` は標準手段にできない。
- write や dashboard 変更の前に、AI が read-only で current state を確認する必要がある。
- remote にすでに存在する `mission-20260509-notification-rls-check` を正本にすることで二重管理を避ける。
- Human は approval / rejection のみ担当し、メール本文転記、SQL 組み立て、dashboard 目視確認の担当にしない。

## impact

- affected docs:
  - `docs/ai-team/ops/notification-intake/queue.md`
  - `docs/ai-team/ops/notification-intake/runs/20260509-codex-process-pending-ntf-20260509-01.md`
  - `docs/ai-team/missions/mission-20260509-notification-rls-check/`
- affected code:
  - none
- affected DB / migration:
  - none in this queue processing step
- affected credential / dashboard:
  - none
- affected operations:
  - `NTF-20260509-01` is now tracked by the canonical active read-only DB Inspector Mission.

## follow-up

- DB Inspector Agent runs read-only RLS / policy / sensitive column checks.
- If remediation is required, create `approval-needed.md` and stop before any gated operation.
- If Supabase Advisor continues to show a specific active alert, add a new sanitized queue entry with target category only.

## revisit condition

- DB Inspector finds no current issue and classifies the notification as historical/resolved.
- DB Inspector finds unresolved DB/security exposure.
- Supabase alert contains provider-specific context not represented in sanitized queue fields.

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human を Agent 間通信路にしない。
