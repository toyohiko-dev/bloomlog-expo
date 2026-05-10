# Notification Intake Entry Template

作成日: 2026-05-09

Sakura / ChatGPT は Gmail read-only intake 後、この形式で sanitized entry を作る。

この template は notification / ops intake 専用である。Mission core schema ではない。通知から Mission に切り出す場合は、`docs/ai-team/templates/mission-template.md` を使い、`mission_origin.type: notification` として queue entry を参照する。

raw email body、認証情報、dashboard URL、project ID、内部 ID は保存しない。

```md
### NTF-YYYYMMDD-NN

- schema_version: ai-is-queue-entry/v1
- queue_id: NTF-YYYYMMDD-NN
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
- approval_gate_candidate: none / DB / dashboard / credential / production write / db push / migration repair / main merge
- sanitization:
  - raw_body_saved: false
  - credentials_saved: false
  - dashboard_url_saved: false
  - project_id_saved: false
- dispatch:
  - recommended_flow: queue-only / docs-record / db-inspector-followup / code-followup / security-hygiene-followup / approval-package
  - execution_mode: docs-only / read-only-introspection / approval-gated-write
  - mission_required: true / false
  - approval_gate_expected: yes / no / unknown
  - human_role: trigger-only / approval-rejection-only
  - codex_autonomy:
    -
  - stop_condition:
    -
- repo_check_targets:
  -
- codex_next_action:
  -
- human_action: none / approval-rejection-only
- mission_origin:
  - create_mission: true / false
  - mission_type: feature / UX / refactor / research / infra / ops / notification / DB / security / docs / none
  - mission_ref: none / docs/ai-team/missions/mission-YYYYMMDD-short-name/mission.md
- redaction_check:
  - raw_body_saved: no
  - credentials_saved: no
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

## Schema adoption rules

- `schema_version` と `queue_id` は新規 entry で必須とする。
- `queue_id` は見出しの `NTF-YYYYMMDD-NN` と一致させる。
- `sanitization.*` はすべて `false` のままにする。
- `redaction_check.*` は従来互換の human-readable 確認欄として残す。
- raw email body、認証情報、dashboard URL、project ID、内部 ID は保存しない。
- `dispatch.mission_required: true` の場合、Codex 処理後の `follow_up.mission` は official Mission path を指す。
- Mission 化する場合、notification は optional origin として扱い、Mission core schema には notification-specific fields を入れない。
- `approval_gate_candidate` が `none` 以外の場合、queue 内で execution 完了扱いにしない。
- `blocked` にする場合は、正確な blocker と unblock condition を notes または codex_decision に書く。
