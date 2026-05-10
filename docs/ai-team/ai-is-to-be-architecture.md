# Bloomlog AI-IS TO-BE Architecture

作成日: 2026-05-10

## 1. Purpose

このドキュメントは、Bloomlog AI-IS（AI Integration System / AI Team Operating System）の TO-BE architecture を定義する。

目的は、会話を作業の入口として使いながらも、会話そのものを正本にしない運用構造を作ることである。AS-IS では repo-driven 方針は存在するが、Conversation Layer と Execution Layer の境界、machine-readable state、schema validation、path enforcement が弱く、Conversation AI が Mission schema を即興生成してしまう余地がある。

この TO-BE は設計方針であり、このドキュメント作成時点では実装を含まない。Skill 化、Plugin 化、MCP 実装、state json 作成、agent-os/ 新構造追加、app / lib / supabase / migrations / package.json / `.env*` 変更、DB write、dashboard change は行わない。

## 2. Design Principles

- Conversation Layer と Execution Layer を分離する。
- 会話は意図、優先順位、承認、却下を受け取る入口であり、canonical state ではない。
- Execution Layer は repo 上の machine-readable state と validated artifacts を正本として動く。
- Mission は即興生成しない。正式 Mission は strict schema に従い、validation を通ったものだけを official とする。
- Path は宣言だけでなく、権限、禁止操作、検証条件と結び付ける。
- Human は approver、priority setter、rejector を主責務とする。
- Execution AI の選定は、layer、state、schema、path enforcement を定義した後に扱う。
- TO-BE は AS-IS を破棄するものではなく、AS-IS で確認された問題を境界と state の明確化で制御する。

## 3. Layer Model

### Conversation Layer

Conversation Layer は、Human / Sakura / Conversation AI が意図、背景、優先順位、承認、却下、違和感を扱う layer である。

Conversation Layer が扱うもの:

- Human の目的。
- Human の優先順位。
- Human approval / rejection。
- Sakura の方針レビュー、人間意図の翻訳、監査観点。
- Mission 候補の自然言語メモ。
- Queue entry 化前の通知要約。
- Execution Layer へ渡す draft request。

Conversation Layer が canonical にしてはいけないもの:

- Mission state。
- path type。
- approval status。
- execution status。
- verification status。
- queue status。
- branch / PR / merge 状態。
- DB / migration execution result。
- 正式 schema。

Conversation Layer の出力は、Execution Layer に渡るまでは `draft` として扱う。会話中の「やる」「承認」「完了」は、そのまま canonical state にならない。

### Execution Layer

Execution Layer は、repo、validated mission files、queue、branch、PR、state file、CI / validation result を正本として扱う layer である。

Execution Layer が扱うもの:

- official Mission。
- machine-readable state。
- queue state。
- path declaration。
- permission model。
- prohibited action checks。
- validation result。
- branch / PR state。
- execution report。
- approval package。
- audit log。

Execution Layer は、Conversation Layer の draft request をそのまま実行しない。必ず source-of-truth priority、schema validation、path enforcement、approval gate 判定を通す。

### Boundary Rules

- Conversation Layer は official Mission を直接確定できない。
- Conversation Layer は approval intent を表明できるが、Execution Layer は approval record と対象 operation の一致を検証する。
- Execution Layer は validation を通らない artifact を official として扱わない。
- Execution Layer は path violation を検出したら execution を止め、reason と required correction を state に記録する。
- Human に確認を求めるのは、approval / rejection、priority conflict、policy conflict、unblock に必要な意思決定がある場合に限定する。

## 4. Source of Truth Priority

TO-BE の canonical priority は次の順とする。

| priority | source | role |
| --- | --- | --- |
| 1 | production repo `main` | product と AI-IS の production canonical。 |
| 2 | merged PR record | main に入った変更の review / approval / validation 記録。 |
| 3 | active branch state file | 作業 branch 上の machine-readable Mission / queue / path state。 |
| 4 | official `mission.md` | Human / Sakura / Parent intention を schema 化した Mission 正本。 |
| 5 | queue state | notification intake や ops job の入力キュー状態。 |
| 6 | PR description / issue | review、merge 判断、未着手 work item の補助正本。 |
| 7 | reports / decision-log / approval-needed | Mission の判断材料、結果、承認 package。 |
| 8 | conversation transcript | draft input、補足、進捗の一時情報。canonical state ではない。 |

### Canonical Objects

TO-BE では、次を canonical object として扱う。

- `mission`
- `task`
- `queue_entry`
- `approval_request`
- `execution_record`
- `verification_record`
- `decision_record`
- `path_policy`

各 canonical object は machine-readable state を持つ。Markdown は人間が読む説明を保持するが、state の正本は machine-readable section または sidecar state file に置く。

### Conversation Output Status

Conversation Layer の出力は、Execution Layer に取り込まれるまで次のどれかである。

- `draft_intent`
- `draft_mission_request`
- `draft_approval_intent`
- `draft_rejection_intent`
- `draft_priority_change`
- `draft_queue_note`

draft は validation 済み artifact ではない。Execution Layer は draft を official に昇格する前に schema validation と source-of-truth conflict check を行う。

## 5. Mission Generation Responsibility

### Mission Creation Flow

TO-BE では、正式 `mission.md` は Conversation AI が即興生成しない。

正式 Mission 生成の flow:

1. Conversation Layer が `draft_mission_request` を作る。
2. Mission Generator が draft を受け取る。
3. Mission Generator が strict Mission schema に従って `mission` object を生成する。
4. Validator が schema、source-of-truth conflict、path policy、approval gate を検証する。
5. Parent Agent が validated Mission を official として repo に書く。
6. official Mission の生成結果を audit log / decision record に残す。

### Responsible Actors

| actor | responsibility |
| --- | --- |
| Human | Mission objective、priority、approval / rejection を与える。 |
| Sakura | Human intent の翻訳、方針レビュー、監査観点を与える。 |
| Conversation AI | draft request を整理する。official schema を即興確定しない。 |
| Mission Generator | strict schema に従って machine-readable Mission object を生成する。 |
| Validator | schema と policy を検証する。 |
| Parent Agent | validation 済み Mission を repo に official として記録する。 |

### Draft vs Official

| status | meaning |
| --- | --- |
| `draft` | 会話または queue から来た未検証 request。実行不可。 |
| `validated` | schema validation と policy check を通ったが、まだ official commit 前。 |
| `official` | repo に記録された実行対象 Mission。 |
| `rejected` | validation または Human / Sakura 判断で official 化しないもの。 |
| `superseded` | 別 Mission または decision record に置き換えられたもの。 |

### Conversation AI Restrictions

Conversation AI は次をしてはいけない。

- official `mission.md` の schema を即興で決める。
- approval gate を会話だけで解除する。
- path type を会話だけで確定する。
- validation 前の Mission を execution-ready と扱う。
- machine-readable state と矛盾する Markdown を正本として扱う。

## 6. Schema Enforcement

### Strict Schema

TO-BE では、Mission / Queue / Approval / Execution / Verification の schema を strict にする。

Mission schema に含める field:

```yaml
schema_version: ai-is-mission/v1
mission_id: string
title: string
status: draft | validated | official | active | approval-needed | executing | verification-partial | completed | blocked | rejected | superseded
layer_origin: conversation | queue | repo | issue | pr
owner_role: Parent Agent
path_type: docs-only | code-pr | db-migration | notification-intake | approval-package
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
source_refs: list
artifacts: list
residual_risk: string
next_action: string
created_at: date
updated_at: date
```

Queue schema に含める field:

```yaml
schema_version: ai-is-queue-entry/v1
queue_id: string
status: pending | triaged | completed | follow-up-created | approval-needed-candidate | blocked
source_role: Sakura | ChatGPT | Human | system
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
```

Approval schema に含める field:

```yaml
schema_version: ai-is-approval/v1
approval_id: string
target_mission_id: string
gate_type: main-merge | db-write | migration-apply | migration-repair | db-push | destructive-sql | secret | dashboard | production-write | large-structure-change
requested_operation: string
risk_summary: string
rollback_plan: string
verification_plan: string
approval_status: pending | approved | rejected
approved_by: Human | none
approved_at: date | none
```

### Validation

Validator は少なくとも次を確認する。

- required field が存在する。
- enum field が許可値だけを持つ。
- `path_type` と `allowed_paths` / `prohibited_paths` が矛盾しない。
- `approval.required` と `approval.gates` が一致する。
- `execution.status` が approval gate を飛び越えていない。
- queue entry に raw body、credential、dashboard URL、project ID が保存されていない。
- Markdown summary と machine-readable state が矛盾していない。
- branch state と mission state が矛盾していない。

### Machine-Readable State

TO-BE では、Markdown だけを state 正本にしない。候補は次のいずれかとする。

- Markdown front matter の strict YAML。
- `mission.state.json` sidecar file。
- repo-level `ai-is-state.json`。

この設計段階では、どれを採用するかは implementation decision として分離する。ただし、どの方式でも validation 可能であることを必須条件にする。

### Markdown Relationship

Markdown は次を担う。

- Human-readable purpose。
- 背景。
- decision rationale。
- risk。
- rollback explanation。
- verification notes。

Markdown は state の唯一の正本にならない。Markdown と state が矛盾する場合、Validator が execution を止める。

## 7. Path Enforcement

### Path Declaration

TO-BE の path は、単なるラベルではなく enforcement contract とする。

Path declaration は次を持つ。

- `path_type`
- `allowed_paths`
- `prohibited_paths`
- `allowed_actions`
- `prohibited_actions`
- `required_validations`
- `approval_gates`
- `stop_conditions`

### Path Types

| path_type | allowed scope | gate behavior |
| --- | --- | --- |
| `docs-only` | `docs/**/*.md` の新規作成・限定編集 | docs-only validation が通れば commit / push 可。 |
| `code-pr` | app / lib などの code change | PR 必須。main merge は approval gate。 |
| `db-migration` | DB / migration / RLS / policy / trigger / function | read-only introspection までは可。write は approval gate。 |
| `notification-intake` | sanitized queue / run log / follow-up decision | raw body / secret 保存は禁止。gated operation は Mission 化。 |
| `approval-package` | approval-needed / risk / rollback / verification plan | Human approval なしに execution へ進めない。 |

### Implicit Permissions

Path は暗黙権限を定義する。

`docs-only` の implicit permissions:

- `docs/ai-team/**/*.md` を作成・編集できる。
- `git status`、`git diff`、`git diff --check`、commit、push を実行できる。
- app / lib / supabase / migrations / package / `.env*` は触れない。

`db-migration` の implicit permissions:

- repo migration を読む。
- remote DB の read-only introspection を行う。
- rollback plan と approval package を作る。
- DB write、`db push`、migration repair、destructive SQL は approval まで禁止。

### Auto Validation

Execution Layer は作業前、stage 前、commit 前、push 前に validation を行う。

Required checks:

- current branch。
- dirty working tree。
- changed files。
- staged files。
- prohibited paths。
- prohibited actions。
- approval gate status。
- schema validity。
- secrets / raw notification content absence。
- required reports present。

### Prohibited Action Enforcement

Prohibited action は docs 上の注意書きではなく、execution stop condition として扱う。

Stop examples:

- `docs-only` で `app/` が変更された。
- `docs-only` で file deletion / archive move が含まれる。
- approval pending のまま `db push` が要求された。
- queue entry に raw email body が保存された。
- `mission.md` が schema validation を通っていない。
- Conversation Layer の approval intent が approval schema に記録されていない。

## 8. Queue Ownership

### Ownership Model

Notification queue は Ops object として扱い、Mission とは分離する。

| object | owner | role |
| --- | --- | --- |
| notification intake source | Sakura / ChatGPT | read-only intake と sanitized summary 作成。 |
| queue entry | Queue Owner | sanitized entry の状態管理。 |
| triage decision | Codex / Execution AI | repo と照合して queue-only / Mission / approval candidate を判定。 |
| follow-up Mission | Parent Agent | queue から bounded Mission へ切り出す。 |
| approval package | Parent Agent / DB Inspector Agent | gated operation の判断材料を作る。 |
| approval / rejection | Human | gated operation の承認または却下。 |

### Queue to Mission Boundary

Queue 内で完了してよいもの:

- newsletter。
- historical resolved。
- low severity informational notification。
- repo 現状と照合して対応不要と判断できる notification。
- `dispatch.recommended_flow: queue-only` で追加調査不要のもの。

Mission に切り出すもの:

- DB / RLS / policy / trigger / function / migration の read-only 照合が必要。
- code change 候補がある。
- dashboard / credential / production setting 変更候補がある。
- `db push`、migration repair、production DB write、destructive SQL の可能性がある。
- 複数 queue entry を横断して判断する必要がある。
- rollback / verification / approval package が必要。
- `dispatch.mission_required: true`。

### Approval Gate Boundary

Queue は approval gate を解除しない。Queue は approval-needed candidate を作れるが、execution には進めない。

Approval gate に入る条件:

- queue entry から gated operation の可能性が確認された。
- Mission または approval package に対象、影響、risk、rollback、verification が整理された。
- Human が承認または却下できる単位に bounded されている。

## 9. Human Boundary

### Human Responsibilities

TO-BE で Human が担うこと:

- priority setter。
- approver。
- rejector。
- product / policy conflict の意思決定者。
- main merge の承認者。
- production-impacting operation の承認者。

### Human Non-Responsibilities

Human が担わないこと:

- Agent 間通信路。
- file transcription。
- diff checker。
- screenshot operator。
- routine visual checker。
- SQL runner for read-only checks。
- dashboard watcher when AI can inspect equivalent state.
- Mission state updater。

### Allowed Manual Work

Human manual work を許容する範囲:

- secret の入力や dashboard 操作など、AI に任せるべきではない操作。
- account owner 権限が必要な dashboard approval。
- billing / domain / OAuth provider など production setting の最終操作。
- AI がアクセスできない外部 systems での承認クリック。

Manual work が発生した場合も、Human は結果を長文転記しない。Execution Layer は必要最小限の approval result、timestamp、operator category、verification result を repo / PR / issue に記録する。

## 10. Execution AI Selection

Execution AI の選定は、Layer / Source of Truth / Schema / Path Enforcement を定義した後に行う。

### Codex

Use when:

- repo files を読み書きする。
- docs-only safe path を実行する。
- code branch + PR path を実行する。
- validation、diff、commit、push、PR preparation を行う。
- local workspace で build / test / lint / browser verification を行う。

Boundary:

- schema validation と path enforcement を通った official Mission を入力にする。
- Conversation Layer の draft を直接 execution-ready と扱わない。

### Claude Code

Use when:

- 別 execution environment で code implementation / review / investigation を並列に行う。
- repo canonical state を読ませ、task file または official Mission を入力にできる。

Boundary:

- Claude Code の出力も repo / PR / report に戻す。
- chat output を canonical state にしない。

### MCP

Use when:

- Execution Layer が external system の read-only state または controlled action を必要とする。
- Gmail、GitHub、Slack、Drive、Supabase などの tool boundary を明確にできる。

Boundary:

- MCP は source of truth ではなく access mechanism である。
- MCP action は path policy と approval gate に従う。

### Skill

Use when:

- 반복的な validation、document generation、notification intake、DB inspection などを reusable workflow としてまとめる。

Boundary:

- Skill は execution helper であり、Mission schema の正本ではない。
- Skill は official Mission と path policy を入力にする。

### Plugin

Use when:

- 複数 skill / tool / connector を AI-IS execution package としてまとめる必要がある。

Boundary:

- Plugin は capability packaging であり、Source of Truth ではない。
- Plugin behavior は strict schema と validation に従う。

## 11. Migration From AS-IS

### What Remains

AS-IS から残すもの:

- `AGENTS.md` を作業入口にする。
- `docs/product/` を正式仕様とする。
- `docs/ai-team/` を AI 運用、分析、レビュー、handoff、承認前判断材料に使う。
- Human は approver / rejector を主責務とする。
- AI は read-only introspection、diff、検証、rollback 案作成を行う。
- docs-only safe path は AI が commit / push まで行える。
- production write、DB、secret、dashboard、main merge は approval gate に入る。

### What Changes

TO-BE で変えるもの:

- Conversation Layer を canonical state から外す。
- official Mission 生成を schema-driven にする。
- YAML-like fields を strict schema と validation に置き換える。
- Markdown-only state から machine-readable state へ移行する。
- path label を enforcement contract にする。
- queue と Mission の ownership boundary を明確にする。
- Execution AI は official Mission / state / path policy を入力にする。

### What Is Not Yet Implemented

このドキュメント作成時点では、次は未実装である。

- strict schema files。
- schema validator。
- machine-readable state file。
- path enforcement tool。
- automatic prohibited action checker。
- Mission Generator。
- Queue Owner automation。
- Skill / Plugin / MCP integration。

## 12. Adoption Order

TO-BE は次の順で導入する。

1. Layer boundary を確定する。
2. Source of Truth priority を確定する。
3. Mission schema を定義する。
4. Queue / Approval / Execution / Verification schema を定義する。
5. Validator を導入する。
6. Path enforcement を導入する。
7. Queue ownership を明確化する。
8. Human boundary を運用に反映する。
9. Execution AI selection を実装構成に落とす。
10. Skill / Plugin / MCP integration を必要に応じて設計する。

この順序は、思想、state、schema、execution の順で依存関係を固定するためのものとする。
