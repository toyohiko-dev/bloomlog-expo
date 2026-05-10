# Bloomlog AI-IS Schema Adoption Package

作成日: 2026-05-10

## 1. Purpose

このドキュメントは、`docs/ai-team/ai-is-schema-and-enforcement.md` で定義した schema / validation / path enforcement を、どの順序で Bloomlog AI-IS に採用するかを定義する。

目的は、実装前に adoption boundary を固定し、既存 docs / Mission を壊さず、新規 Mission から strict schema と validation を導入できる状態を作ることである。

このドキュメントは設計であり、schema file 作成、validator 実装、state json 作成、既存 Mission の一括移行、Skill 化、Plugin 化、MCP 実装、app / lib / supabase / migrations / package.json / `.env*` 変更、DB write、dashboard change は行わない。

## 2. Adoption Goal

Schema adoption のゴールは次の状態である。

- Conversation Layer の draft が official Mission と混同されない。
- 新規 Mission は strict schema に沿った state を持つ。
- Path policy が allowed paths、prohibited paths、allowed actions、prohibited actions を持つ。
- docs-only safe path の commit / push 前に、機械的に確認すべき項目が定義されている。
- approval gate が必要な Mission は approval request と execution record を分離する。
- queue entry から Mission 化する境界が schema 上で表現される。

この adoption package は「設計上の採用単位」であり、まだ enforcement tool の実装単位ではない。

## 3. State File Strategy Decision

TO-BE の state file strategy は、段階導入のために次の方針を採用する。

| option | decision | reason |
| --- | --- | --- |
| strict YAML front matter | primary adoption path | Markdown と同じ file に state を置けるため、既存 docs 運用と親和性が高い。 |
| sidecar json | deferred candidate | validator 実装時に必要なら導入する。既存 Mission directory を増やすため初期導入では保留。 |
| repo-level state index | not first adoption | central index は強力だが、初期導入では conflict と更新責務が増える。 |

初期 adoption では、新規 Mission の `mission.md` に strict YAML front matter を追加する。

採用理由:

- 既存 `mission.md` の YAML-like fields から移行しやすい。
- Human / Sakura / Agent が Markdown と state を同時に読める。
- docs-only safe path の範囲に収まる。
- validator 実装前でも review が可能である。

制約:

- front matter は手書き編集に弱い。
- Markdown 本文との矛盾検出には validator が必要である。
- 複数 object の横断 state 管理には向かない。

## 4. Schema File Placement

将来 schema file を作成する場合の配置候補は次とする。

```text
docs/ai-team/schemas/
  ai-is-mission.schema.yaml
  ai-is-queue-entry.schema.yaml
  ai-is-approval.schema.yaml
  ai-is-execution.schema.yaml
  ai-is-verification.schema.yaml
  ai-is-path-policy.schema.yaml
```

この adoption package では、上記 directory / schema files はまだ作成しない。

配置方針:

- `docs/ai-team/schemas/` は AI-IS schema の canonical directory とする候補である。
- schema files は Markdown docs ではなく machine-readable schema として扱う。
- schema docs と schema files が矛盾する場合、実装後は schema files を優先する。
- schema files 作成は別 Mission として扱う。

## 5. Front Matter Contract

新規 Mission の `mission.md` は、次の front matter contract を持つ。

```yaml
---
schema_version: ai-is-mission/v1
mission_id: mission-YYYYMMDD-short-name
title: Short mission title
status: draft
layer_origin: conversation
owner_role: Parent Agent
created_by: Parent Agent
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
path_type: docs-only
objective: Short objective
success_criteria:
  - One measurable success condition
non_goals:
  - One explicit non-goal
source_refs:
  - docs/ai-team/ai-is-to-be-architecture.md
scope:
  allowed_paths:
    - docs/ai-team/**
  prohibited_paths:
    - app/**
    - lib/**
    - supabase/**
    - package.json
    - .env*
  allowed_actions:
    - read-docs
    - edit-docs
    - git-diff
    - git-commit
    - git-push
  prohibited_actions:
    - db-write
    - db-push
    - migration-repair
    - dashboard-change
approval:
  required: false
  gates: []
  status: not-required
execution:
  status: not-started
verification:
  status: not-started
artifacts:
  tasks: []
  reports: []
  decisions: []
  approvals: []
residual_risk: none
next_action: One concrete next action
---
```

Rules:

- `schema_version` は必須である。
- `mission_id` は directory name と一致させる。
- `path_type` は `scope` と矛盾してはならない。
- `approval.required: true` の場合、`approval.gates` は空にしない。
- `next_action` は一つの具体的 action にする。

## 6. Path Policy Adoption

初期 adoption では、path policy を mission front matter の `scope` に含める。

最初に対応する path:

| path_type | adoption status | reason |
| --- | --- | --- |
| `docs-only` | first | 既存運用と合い、DB / app code への影響がない。 |
| `notification-intake` | second | queue から Mission への境界に必要。 |
| `approval-package` | second | Human approval boundary を schema 化するために必要。 |
| `code-pr` | later | app code に影響するため、validator 導入後に扱う。 |
| `db-migration` | later | DB write / migration gate を含むため、approval schema と validator 導入後に扱う。 |

Initial docs-only validation checklist:

- current branch が想定 branch である。
- working tree に unrelated changes がない。
- changed files が `docs/` 配下のみである。
- staged files が `docs/` 配下のみである。
- file deletion / archive move がない。
- `app/`、`lib/`、`supabase/`、`package.json`、`.env*` が含まれない。
- DB write、`db push`、migration repair、dashboard change がない。
- raw email body、secret、token が保存されていない。
- required docs が存在する。

## 7. Validator Timing

Validator は段階的に導入する。

Design-time validation:

- Reviewer / Parent が front matter を目視 review する。
- `git diff --name-only` と `git diff --stat` で path を確認する。
- `git diff --check` で whitespace を確認する。

Tool-time validation:

- schema files 作成後に validator command を導入する。
- pre-commit 前に schema validation を実行する。
- pre-push 前に branch ahead / behind と prohibited paths を確認する。

Future validation command candidate:

```text
ai-is validate --mission docs/ai-team/missions/<mission-id>/mission.md
ai-is validate --path docs-only
ai-is validate --queue docs/ai-team/ops/notification-intake/queue.md
```

この adoption package では command 実装は行わない。

## 8. Queue Adoption

Queue entry の machine-readable 化は、front matter ではなく entry block contract から始める。

理由:

- 現在の `queue.md` は複数 entry を 1 file に持つ。
- front matter は file 全体にしか自然に適用できない。
- queue entry ごとの state は block 単位で管理する必要がある。

Initial queue adoption:

- `queue.md` の template に `schema_version: ai-is-queue-entry/v1` を追加する。
- 新規 entry から schema field を必須にする。
- 既存 entry はそのまま保持し、一括移行しない。
- validator 導入までは Reviewer / Parent が required fields を確認する。

Queue to Mission rule:

- `dispatch.mission_required: yes` は follow-up Mission 作成の trigger とする。
- follow-up Mission は Mission front matter contract を持つ。
- queue entry の `follow_up.mission` は official Mission path を指す。

## 9. Existing Mission Migration Policy

既存 Mission は一括移行しない。

理由:

- 既存 Mission は AS-IS record であり、履歴としての価値がある。
- 一括編集は docs-only でも差分が大きくなり、review 負荷が高い。
- completed / superseded Mission を再開しないという AS-IS 原則と整合する。

Migration policy:

- 新規 Mission から front matter contract を適用する。
- 既存 active Mission がある場合だけ、Parent 判断で最小 front matter を追加する。
- completed / superseded Mission は移行しない。
- 既存 Mission を参照する場合は、AS-IS format として扱う。

## 10. Adoption Phases

### Phase 1: Design Freeze

Deliverables:

- `docs/ai-team/ai-is-to-be-architecture.md`
- `docs/ai-team/ai-is-schema-and-enforcement.md`
- `docs/ai-team/ai-is-schema-adoption-package.md`

Status:

- docs-only。
- 実装なし。

### Phase 2: Template Update

Deliverables:

- `docs/ai-team/templates/mission-template.md` の front matter 対応。
- `docs/ai-team/ops/notification-intake/template.md` の queue schema 対応。

Scope:

- docs-only。
- 既存 Mission の一括移行なし。
- validator 実装なし。

### Phase 3: Schema Files

Deliverables:

- `docs/ai-team/schemas/*.schema.yaml`

Scope:

- docs-only。
- machine-readable schema files を追加。
- validator 実装なし。

### Phase 4: Validator Design

Deliverables:

- validator command design。
- validation gate mapping。
- failure report format。

Scope:

- docs-only。
- code implementation なし。

### Phase 5: Validator Implementation

Deliverables:

- validator implementation。
- docs-only validation command。

Scope:

- code branch + PR path。
- package / script 変更が必要な場合は別 Mission。
- main merge は Human approval gate。

## 11. Human Boundary During Adoption

Human が行うこと:

- adoption direction の承認または却下。
- priority conflict の判断。
- main merge の承認。
- production-impacting operation の承認。

Human が行わないこと:

- schema field の手作業転記。
- existing Mission の一括移行作業。
- diff 確認係。
- validator 代行。
- queue entry の機械的整形係。

## 12. Non-Goals

この adoption package では次を行わない。

- schema files を作成しない。
- validator を実装しない。
- state json を作成しない。
- existing Mission を一括移行しない。
- app / lib / supabase / migrations / package.json / `.env*` を変更しない。
- DB write、`db push`、migration repair、dashboard change を行わない。
- Skill / Plugin / MCP を実装しない。

## 13. Next Action

次の実行候補は Phase 2 の docs-only Template Update である。

対象:

- `docs/ai-team/templates/mission-template.md`
- `docs/ai-team/ops/notification-intake/template.md`

実行条件:

- docs-only safe path。
- 既存 Mission は移行しない。
- template のみを strict schema adoption に合わせる。
