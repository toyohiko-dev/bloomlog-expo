# Mission Template

新規 Mission はこの template から作成する。

既存 Mission は一括移行しない。completed / superseded Mission を再開しない。状態管理は `docs/ai-team/mission-lifecycle.md` と `docs/ai-team/ai-is-schema-adoption-package.md` に従う。

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

## Mission ID

`mission-YYYYMMDD-short-name`

`mission_id` は directory name と一致させる。

## Title

<!-- Mission の短いタイトルを書く。 -->

## Objective

<!-- この Mission で達成することを書く。front matter の objective と矛盾させない。 -->

## Background

<!-- 背景、依頼元、関連 docs / issue / PR を書く。Human や Sakura を Agent 間通信路にしない。最終状態は repo / GitHub に残す。 -->

## Source Refs

- `AGENTS.md`
- `docs/product/`
- `docs/ai-team/ai-is-current-state.md`
- `docs/ai-team/ai-is-to-be-architecture.md`
- `docs/ai-team/ai-is-schema-and-enforcement.md`
- `docs/ai-team/ai-is-schema-adoption-package.md`

不要なものは削除し、必要な docs だけを残す。

## Success Criteria

- 

## Scope

### Allowed Paths

- 

### Prohibited Paths

- `app/**`
- `lib/**`
- `supabase/**`
- `package.json`
- `.env*`

## Non-Goals

- 

## Path Type

該当するものを 1 つだけ残す。

- `docs-only`
- `notification-intake`
- `approval-package`
- `code-pr`
- `db-migration`

`path_type` は front matter の `scope` と矛盾させない。

## Required Agents

該当するものを残す。

- Parent Agent
- Writer Agent
- Reviewer Agent
- QA Agent
- DB Inspector Agent
- Sakura
- Human

## Approval Gates

Human intervention は approval gate のみに限定する。

- approval required: true / false
- approval gates:
  - main-merge
  - db-write
  - migration-apply
  - migration-repair
  - db-push
  - destructive-sql
  - secret
  - dashboard
  - production-write
  - large-structure-change
  - none
- approval reason:

front matter の `approval.required`、`approval.gates`、`approval.status` と矛盾させない。

## Target Branch

`branch-name`

docs-only safe path では、Reviewer Agent が条件確認後、AI が作業 branch へ auto commit / push する。

## Output Locations

- mission:
- tasks:
- reports:
- decision log:
- approval-needed:
- branch:
- PR:
- issue:

## Validation

docs-only safe path の初期 validation:

- current branch が想定 branch である。
- working tree に unrelated changes がない。
- changed files が `docs/` 配下のみである。
- staged files が `docs/` 配下のみである。
- file deletion / archive move がない。
- `app/`、`lib/`、`supabase/`、`package.json`、`.env*` が含まれない。
- DB write、`db push`、migration repair、dashboard change がない。
- raw email body、secret、token が保存されていない。
- required docs が存在する。

## Prohibited Content

- secret / token を保存しない。
- メール本文全文を保存しない。
- raw notification body を保存しない。
- dashboard URL、project ID、内部 ID を不要に保存しない。
- Human に Agent 間通信の転記を依頼しない。
