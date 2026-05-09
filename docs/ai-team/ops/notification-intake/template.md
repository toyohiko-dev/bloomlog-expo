# Notification Intake Entry Template

作成日: 2026-05-09

Sakura / ChatGPT は Gmail read-only intake 後、この形式で sanitized entry を作る。

raw email body、secret、token、dashboard URL、project ID、内部 ID は保存しない。

```md
### NTF-YYYYMMDD-NN

- status: pending
- source_role: Sakura / ChatGPT
- intake_date: YYYY-MM-DD
- provider: Supabase / Vercel / GitHub / other
- notification_type: security / db / auth / deploy / domain / billing / quota / newsletter / incident / unknown
- sanitized_subject:
- sanitized_summary:
  -
- severity: high / medium / low / unknown
- confidence: high / medium / low
- affected_area: auth / deploy / DB / env / billing / domain / GitHub運用 / docs / unknown
- action_class: 対応不要 / docs記録 / code変更候補 / DB対応候補 / dashboard変更候補 / Human approval needed
- approval_gate_candidate: none / DB / dashboard / secret / production write / db push / migration repair / main merge
- repo_check_targets:
  -
- codex_next_action:
  -
- human_action: none / approval-rejection-only
- redaction_check:
  - raw_body_saved: no
  - secret_or_token_saved: no
  - dashboard_url_saved: no
  - project_id_saved: no
- notes:
  -
```

## Codex 更新欄

Codex が処理したら、同じ entry に次を追記する。

```md
- codex_status: triaged / completed / follow-up-created / approval-needed-candidate / blocked
- codex_repo_check:
  -
- codex_decision:
  -
- follow_up:
  - mission: none / path
  - approval_needed: none / path
- run_log: docs/ai-team/ops/notification-intake/runs/YYYYMMDD-*.md
```
