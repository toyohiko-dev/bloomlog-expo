# Notification Intake Queue

作成日: 2026-05-09

このファイルは Agent Input Queue である。

Sakura / ChatGPT は Gmail read-only intake から raw body を保存しない sanitized entry を追加する。Codex は `pending` entry を読み、repo 状態と照合して処理する。

## Pending

なし。

## Triaged

### NTF-20260509-02

- status: triaged
- source_role: Sakura / ChatGPT
- intake_date: 2026-05-09
- provider: Vercel
- notification_type: security / incident
- sanitized_subject: Vercel internal incident notice
- sanitized_summary:
  - Vercel の internal incident に関する security update が確認された。
  - 現時点で Bloomlog account compromise は明示されていない。
  - raw body、dashboard URL、account ID、内部 ID は保存していない。
- severity: medium
- confidence: medium
- affected_area: deploy / security hygiene
- action_class: docs記録
- approval_gate_candidate: none
- dispatch:
  - recommended_flow: docs-record
  - execution_mode: docs-only
  - mission_required: no
  - approval_gate_expected: no
  - human_role: trigger-only
  - codex_autonomy:
    - Keep as triaged docs record unless new account compromise evidence appears.
  - stop_condition:
    - Account compromise, credential rotation, dashboard change, or production setting change becomes necessary.
- repo_check_targets:
  - `docs/ai-team/ops/notification-intake/runs/`
  - `docs/product/dev.md`
- codex_next_action:
  - optional security hygiene review が必要なら別 queue entry または lightweight Mission に切り出す。
- human_action: none
- redaction_check:
  - raw_body_saved: no
  - credentials_saved: no
  - dashboard_url_saved: no
  - project_id_saved: no
- codex_status: triaged
- codex_decision:
  - 現時点では docs記録に留める。account compromise や secret rotation が必要な根拠が出た場合のみ approval gate へ進める。
- run_log: `docs/ai-team/ops/notification-intake/runs/20260509-sakura-gmail-readonly-pilot.md`

### NTF-20260509-03

- status: triaged
- source_role: Sakura / ChatGPT
- intake_date: 2026-05-09
- provider: Supabase
- notification_type: quota / lifecycle
- sanitized_subject: Auto pause warning due to inactivity
- sanitized_summary:
  - Supabase project の inactivity による auto pause warning が確認された。
  - raw body、project ID、dashboard URL は保存していない。
- severity: low-medium
- confidence: medium
- affected_area: DB / operations
- action_class: docs記録 / 対応不要
- approval_gate_candidate: none
- dispatch:
  - recommended_flow: docs-record
  - execution_mode: docs-only
  - mission_required: no
  - approval_gate_expected: no
  - human_role: trigger-only
  - codex_autonomy:
    - Keep as triaged unless current operations impact is found.
    - Move to completed if no current impact is confirmed.
  - stop_condition:
    - Current DB availability or production operations impact is found.
- repo_check_targets:
  - `docs/ai-team/ops/notification-intake/runs/`
  - `docs/product/dev.md`
- codex_next_action:
  - 現在の運用影響がなければ queue 内で completed に進める。
- human_action: none
- redaction_check:
  - raw_body_saved: no
  - credentials_saved: no
  - dashboard_url_saved: no
  - project_id_saved: no
- codex_status: triaged
- codex_decision:
  - low-medium の運用通知として扱う。今後の稼働方針に関係する場合だけ follow-up にする。
- run_log: `docs/ai-team/ops/notification-intake/runs/20260509-sakura-gmail-readonly-pilot.md`

## Completed

### NTF-20260509-04

- status: completed
- source_role: Sakura / ChatGPT
- intake_date: 2026-05-09
- provider: Vercel
- notification_type: deploy
- sanitized_subject: Historical failed production deployment
- sanitized_summary:
  - 過去の production deployment failure が確認された。
  - 現状と照合して historical resolved と判断できる場合は queue 内で完了扱いにする。
  - raw body、deployment URL、project ID、内部 ID は保存していない。
- severity: low
- confidence: medium
- affected_area: deploy
- action_class: 対応不要
- approval_gate_candidate: none
- dispatch:
  - recommended_flow: queue-only
  - execution_mode: docs-only
  - mission_required: no
  - approval_gate_expected: no
  - human_role: trigger-only
  - codex_autonomy:
    - Keep completed as historical resolved.
  - stop_condition:
    - A current production deployment failure is confirmed.
- repo_check_targets:
  - `docs/ai-team/ops/notification-intake/runs/`
- codex_next_action:
  - 追加対応なし。
- human_action: none
- redaction_check:
  - raw_body_saved: no
  - credentials_saved: no
  - dashboard_url_saved: no
  - project_id_saved: no
- codex_status: completed
- codex_decision:
  - historical resolved として queue 内で完了。現行 deploy failure が再確認された場合は新規 entry とする。
- run_log: `docs/ai-team/ops/notification-intake/runs/20260509-sakura-gmail-readonly-pilot.md`

## Follow-up Created

### NTF-20260509-01

- status: follow-up-created
- source_role: Sakura / ChatGPT
- intake_date: 2026-05-09
- provider: Supabase
- notification_type: security / db
- sanitized_subject: RLS disabled and sensitive columns exposure warning
- sanitized_summary:
  - Supabase から、RLS が無効な状態または sensitive columns が露出している可能性に関する security alert が確認された。
  - raw body、dashboard URL、project ID、対象 URL、内部 ID は保存していない。
- severity: high
- confidence: medium
- affected_area: DB
- action_class: DB対応候補 / Human approval needed
- approval_gate_candidate: DB / production write / dashboard / migration repair
- dispatch:
  - recommended_flow: db-inspector-followup
  - execution_mode: read-only-introspection
  - mission_required: yes
  - approval_gate_expected: unknown
  - human_role: approval-rejection-only
  - codex_autonomy:
    - Move queue entry to follow-up-created.
    - Create or update canonical read-only DB Inspector Mission.
    - Stop before DB write, dashboard change, `db push`, migration repair, or credential change.
  - stop_condition:
    - Any gated operation becomes necessary.
    - Remote DB current state cannot be verified read-only.
- repo_check_targets:
  - `docs/ai-team/supabase-db-introspection.md`
  - `docs/ai-team/supabase-migration-ops.md`
  - `docs/ai-team/supabase-rls-remediation-checklist.md`
  - `supabase/migrations/`
- codex_next_action:
  - current state を read-only DB Inspector Mission で確認する。
  - RLS / policy / sensitive columns の現状を read-only で照合する。
  - write、db push、migration repair、dashboard 変更が必要なら approval-needed.md を作成して停止する。
- human_action: approval-rejection-only
- redaction_check:
  - raw_body_saved: no
  - credentials_saved: no
  - dashboard_url_saved: no
  - project_id_saved: no
- codex_status: follow-up-created
- codex_repo_check:
  - Existing docs record prior RLS remediation for `visit_sessions` and `activity_logs`.
  - Existing docs record remote migration history visibility risk; `db push` is not a standard safe path.
  - Repo contains RLS remediation migration `20260508100000_fix_visit_sessions_and_activity_logs_rls.sql`.
- codex_decision:
  - Queue 内では完了しない。
  - read-only DB Inspector follow-up Mission に切り出した。
  - Follow-up Mission completed read-only checks and found no immediate gated remediation candidate.
- follow_up:
  - mission: `docs/ai-team/missions/mission-20260509-notification-rls-check/`
  - mission_status: completed
  - approval_needed: none
- run_log: `docs/ai-team/ops/notification-intake/runs/20260509-codex-process-pending-ntf-20260509-01.md`
- notes:
  - この queue entry だけで DB write へ進まない。
  - Codex local draft `mission-20260509-supabase-security-alert-readonly` is replaced by canonical `mission-20260509-notification-rls-check`.
  - If Supabase Advisor continues to show a specific active alert, add a new sanitized queue entry with target category only.

## Approval Needed Candidates

まだなし。
