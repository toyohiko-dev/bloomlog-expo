# Bloomlog AI-IS Schema and Enforcement

作成日: 2026-05-10

## Status

このドキュメントは過去の schema-first TO-BE 検討資料である。現行の TO-BE 正本は `docs/ai-team/ai-is-to-be-architecture.md` であり、Bloomlog AI-IS v1 は repo-first autonomous workflow を中心に扱う。

この資料にある strict schema、machine-readable state、path enforcement tool は、現行 v1 の必須導入条件ではない。必要性が確認された場合に、別 Mission と Human approval の対象として再検討する。

## 1. Purpose

このドキュメントは、`docs/ai-team/ai-is-to-be-architecture.md` で定義した TO-BE を、schema / validation / path enforcement の設計単位へ分解する。

目的は、Conversation Layer の draft を Execution Layer がそのまま正本化しないようにし、Mission、Queue、Approval、Execution、Verification、Path Policy を strict schema と validation gate で扱うことである。

このドキュメントは設計であり、validator 実装、state json 作成、Skill 化、Plugin 化、MCP 実装、agent-os/ 新構造追加、app / lib / supabase / migrations / package.json / `.env*` 変更、DB write、dashboard change は行わない。

## 2. Schema Boundary

TO-BE の schema は、次の境界を固定する。

- Conversation Layer は draft を作れる。
- Execution Layer は strict schema に合う object だけを validated artifact として扱う。
- validated artifact だけが official Mission / Queue / Approval / Execution record になれる。
- Markdown は説明を保持するが、state の唯一の正本にはならない。
- validation failed の object は execution-ready ではない。

Schema 対象 object:

| object | purpose | canonical state owner |
| --- | --- | --- |
| `mission` | bounded work の正本 | Parent Agent / Execution Layer |
| `queue_entry` | ops intake の入力単位 | Queue Owner / Execution Layer |
| `approval_request` | Human approval gate の判断単位 | Parent Agent / Human |
| `execution_record` | 実行結果 | Executor / Parent Agent |
| `verification_record` | 検証結果 | QA Agent / Parent Agent |
| `decision_record` | 判断履歴 | Parent Agent |
| `path_policy` | 許可 path / 禁止操作 / validation 条件 | Execution Layer |

## 3. State File Strategy

TO-BE では、Markdown-only state を避ける。採用候補は次の 3 つである。

| option | description | status |
| --- | --- | --- |
| strict YAML front matter | `mission.md` や queue docs の front matter に machine-readable state を置く。 | candidate |
| sidecar json | `mission.state.json` や `queue-entry.state.json` を Markdown と同じ directory に置く。 | candidate |
| repo-level state index | `ai-is-state.json` のような repo-level index に state を集約する。 | candidate |

この時点では採用方式を固定しない。ただし、どの方式でも次を満たす必要がある。

- schema version を持つ。
- required field を機械的に検証できる。
- enum field を機械的に検証できる。
- Markdown summary と state の矛盾を検出できる。
- path policy と changed files の矛盾を検出できる。
- approval gate と execution status の矛盾を検出できる。

## 4. Mission Schema Contract

Mission は bounded work の正本である。Conversation AI が即興で official Mission を生成してはいけない。

Required fields:

```yaml
schema_version: ai-is-mission/v1
mission_id: string
title: string
status: draft | validated | official | active | approval-needed | executing | verification-partial | completed | blocked | rejected | superseded
layer_origin: conversation | queue | repo | issue | pr
owner_role: Parent Agent
created_by: Human | Sakura | Parent Agent | Mission Generator
created_at: date
updated_at: date
path_type: docs-only | code-pr | db-migration | notification-intake | approval-package
objective: string
success_criteria: list
non_goals: list
source_refs: list
scope:
  allowed_paths: list
  prohibited_paths: list
  allowed_actions: list
  prohibited_actions: list
approval:
  required: boolean
  gates: list
  status: not-required | pending | approved | rejected
execution:
  status: not-started | not-required | in-progress | completed | failed | blocked
verification:
  status: not-started | not-required | passed | partial | failed | blocked
artifacts:
  tasks: list
  reports: list
  decisions: list
  approvals: list
residual_risk: string
next_action: string
```

Validation rules:

- `mission_id` は repo 内で一意である。
- `status: official` 以降の Mission は `path_type` と `scope` を必須とする。
- `approval.required: true` の場合、`approval.gates` は空であってはならない。
- `approval.status: pending` の Mission は gated execution に進めない。
- `execution.status: in-progress | completed` は approval gate を飛び越えてはならない。
- `path_type` と `scope.allowed_paths` / `scope.prohibited_paths` が矛盾してはならない。
- `source_refs` は AS-IS docs、queue、issue、PR、Human request のいずれかを参照する。
- `next_action` は一つの具体的 action に限定する。

## 5. Queue Entry Schema Contract

Queue entry は ops intake の入力単位である。Notification queue は Mission ではない。

Required fields:

```yaml
schema_version: ai-is-queue-entry/v1
queue_id: string
status: pending | triaged | completed | follow-up-created | approval-needed-candidate | blocked
source_role: Sakura | ChatGPT | Human | system
intake_date: date
provider: Supabase | Vercel | GitHub | other
notification_type: security | db | auth | deploy | domain | billing | quota | newsletter | incident | unknown
sanitized_subject: string
sanitized_summary: list
severity: high | medium | low | unknown
confidence: high | medium | low
affected_area: auth | deploy | DB | env | billing | domain | GitHub運用 | docs | unknown
action_class: 対応不要 | docs記録 | code変更候補 | DB対応候補 | dashboard変更候補 | Human approval needed
approval_gate_candidate: none | DB | dashboard | credential | production write | db push | migration repair | main merge
sanitization:
  raw_body_saved: false
  credentials_saved: false
  dashboard_url_saved: false
  project_id_saved: false
dispatch:
  recommended_flow: queue-only | docs-record | db-inspector-followup | code-followup | security-hygiene-followup | approval-package
  execution_mode: docs-only | read-only-introspection | approval-gated-write
  mission_required: boolean
  approval_gate_expected: yes | no | unknown
  human_role: trigger-only | approval-rejection-only
codex_status: none | triaged | completed | follow-up-created | approval-needed-candidate | blocked
follow_up:
  mission: none | path
  approval_needed: none | path
run_log: none | path
```

Validation rules:

- `sanitization.*` はすべて `false` でなければならない。
- raw email body、credential、dashboard URL、project ID、内部 ID を含む entry は invalid とする。
- `dispatch.mission_required: true` の場合、`follow_up.mission` は最終的に `path` になる。
- `approval_gate_candidate` が `none` 以外の場合、queue 内で execution 完了扱いにしない。
- `recommended_flow: queue-only` 以外で `status: completed` にする場合は decision rationale を必須とする。
- `status: blocked` には blocker と unblock condition を必須とする。

## 6. Approval Request Schema Contract

Approval request は Human が承認または却下できる bounded unit である。

Required fields:

```yaml
schema_version: ai-is-approval/v1
approval_id: string
target_mission_id: string
gate_type: main-merge | db-write | migration-apply | migration-repair | db-push | destructive-sql | secret | dashboard | production-write | large-structure-change
requested_operation: string
target_environment: local | preview | production | unknown
target_files: list
target_systems: list
risk_summary: string
rollback_plan: string
verification_plan: string
unknowns: list
approval_status: pending | approved | rejected
approved_by: Human | none
approved_at: date | none
executor_after_approval: Parent Agent | DB Inspector Agent | Writer Agent | Human | external operator
```

Validation rules:

- `approval_status: approved` には `approved_by: Human` と `approved_at` を必須とする。
- `approval_status: pending` の request は execution record を作れない。
- `gate_type` が DB / migration / destructive SQL の場合、rollback plan を空にできない。rollback 不能な場合は理由を明記する。
- `target_environment: production` の場合、risk summary と verification plan を必須とする。
- secret 値そのものを保存してはならない。

## 7. Execution Record Schema Contract

Execution record は、承認済みまたは approval 不要の操作結果を記録する object である。

Required fields:

```yaml
schema_version: ai-is-execution/v1
execution_id: string
target_mission_id: string
path_type: docs-only | code-pr | db-migration | notification-intake | approval-package
approval_id: none | string
executor_role: Parent Agent | Writer Agent | DB Inspector Agent | QA Agent | Human | external operator
commands_or_actions: list
changed_files: list
result: not-started | succeeded | failed | blocked
started_at: date | none
completed_at: date | none
failure_reason: none | string
rollback_performed: yes | no | not-required
rollback_reference: none | string
```

Validation rules:

- gated operation の場合、`approval_id` は `none` にできない。
- `changed_files` は path policy の `allowed_paths` に収まる必要がある。
- `result: failed | blocked` の場合、`failure_reason` を必須とする。
- destructive action を含む場合、approval record と rollback reference を必須とする。

## 8. Verification Record Schema Contract

Verification record は QA / Parent が検証状態を記録する object である。

Required fields:

```yaml
schema_version: ai-is-verification/v1
verification_id: string
target_mission_id: string
target_execution_id: none | string
checks:
  - name: string
    command_or_method: string
    result: passed | failed | skipped | blocked
    reason: string
overall_status: not-started | not-required | passed | partial | failed | blocked
residual_risk: none | string
follow_up_required: boolean
follow_up_ref: none | path
verified_at: date
verified_by: Parent Agent | QA Agent | DB Inspector Agent | Reviewer Agent
```

Validation rules:

- `overall_status: partial` の場合、skipped / blocked check の reason と residual risk を必須とする。
- `follow_up_required: true` の場合、`follow_up_ref` または `next_action` 相当を必須とする。
- `overall_status: passed` で failed / blocked check が残ってはならない。

## 9. Path Policy Contract

Path policy は permission と stop condition を定義する。

Required fields:

```yaml
schema_version: ai-is-path-policy/v1
path_type: docs-only | code-pr | db-migration | notification-intake | approval-package
allowed_paths: list
prohibited_paths: list
allowed_actions: list
prohibited_actions: list
required_validations: list
approval_gates: list
stop_conditions: list
auto_commit_allowed: boolean
auto_push_allowed: boolean
```

Standard path policies:

| path_type | auto commit / push | required validation |
| --- | --- | --- |
| `docs-only` | allowed when validation passes | status, changed files, staged files, diff check, prohibited content check |
| `code-pr` | commit allowed, PR required | lint / build / test as applicable, review, approval gate check |
| `db-migration` | no production execution without approval | read-only introspection, drift check, approval request |
| `notification-intake` | allowed for sanitized docs | redaction check, queue status consistency, follow-up consistency |
| `approval-package` | allowed for docs package | target / risk / rollback / verification completeness |

Stop conditions:

- prohibited path changed。
- prohibited action requested。
- schema validation failed。
- approval pending but execution requested。
- raw notification body or secret detected。
- branch / mission / queue state conflict。
- Markdown summary contradicts machine-readable state。

## 10. Validation Gates

TO-BE の validation gates は次の順で走る。

| gate | timing | checks |
| --- | --- | --- |
| `intake-validation` | draft intake 時 | source, sanitization, draft status |
| `schema-validation` | official 化前 | required fields, enum, schema version |
| `source-conflict-validation` | official 化前 | repo / branch / queue / mission conflict |
| `path-validation` | execution 前 | allowed paths, prohibited paths, actions |
| `approval-validation` | gated execution 前 | approval request, approval status, target match |
| `pre-stage-validation` | stage 前 | changed files, prohibited content |
| `pre-commit-validation` | commit 前 | staged files, diff check, required reports |
| `pre-push-validation` | push 前 | branch, ahead/behind, remote conflict |
| `post-execution-validation` | execution 後 | result, verification, residual risk |

Validation failure は execution stop とし、次を記録する。

- failed gate。
- failed rule。
- target object。
- reason。
- required correction。
- whether Human decision is needed。

## 11. Conversation to Execution Flow

TO-BE の flow:

```text
Conversation request
  -> draft_intent
  -> draft_mission_request or draft_queue_note
  -> schema generation
  -> validation
  -> official mission / queue entry
  -> path validation
  -> execution or approval gate
  -> execution record
  -> verification record
  -> decision record
```

Rules:

- Conversation request は draft で止まる。
- official 化は schema generation と validation 後に行う。
- execution は official object と path policy を必要とする。
- approval gate が必要な場合、approval request が先に作られる。
- Human approval は target operation と approval request が一致している場合だけ有効である。

## 12. Implementation Non-Goals

このドキュメントでは次を行わない。

- schema file を作成しない。
- validator を実装しない。
- state json を作成しない。
- path enforcement tool を作成しない。
- Mission Generator を作成しない。
- Queue Owner automation を作成しない。
- Skill / Plugin / MCP を実装しない。
- app / lib / supabase / migrations / package.json / `.env*` を変更しない。
- DB write、`db push`、migration repair、dashboard change を行わない。

## 13. Next Design Step

次の設計 step は、implementation ではなく、schema adoption package の範囲を決めることである。

整理対象:

- state file strategy の採用方式。
- schema file の配置。
- validator の実行タイミング。
- docs-only safe path での validation command。
- queue entry の machine-readable 化方式。
- existing Mission を schema に移行するか、新規 Mission から適用するか。

この step でも、実装と migration は分離して扱う。
