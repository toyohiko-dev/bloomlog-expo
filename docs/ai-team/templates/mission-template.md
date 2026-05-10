# Mission Template

新規 Mission はこの template から作成する。

Mission は、Bloomlog AI-IS における bounded development unit である。feature、UX、refactor、research、infra、ops、notification follow-up のいずれにも使える。notification / queue は Mission の optional origin であり、Mission core schema ではない。

既存 Mission は一括移行しない。completed / superseded Mission を再開しない。状態管理は `docs/ai-team/mission-lifecycle.md` と `docs/ai-team/ai-is-to-be-architecture.md` に従う。schema adoption docs は過去の検討資料であり、この template の必須前提ではない。

## Required State

この front matter は Mission の軽量な repo state である。Narrative section と矛盾させない。strict schema や validator は現時点の必須前提にしない。

```yaml
---
template_version: ai-is-mission-template/v1
mission_id: mission-YYYYMMDD-short-name
title: Short mission title
status: draft
intake_source: conversation
mission_origin:
  type: feature | ux | refactor | research | infra | ops | notification | db | security | docs
  ref: none
owner_role: Parent Agent
created_by: Parent Agent
created_at: YYYY-MM-DD
updated_at: YYYY-MM-DD
path_type: docs-only | code-pr | db-migration | notification-intake | approval-package
objective: Short objective
success_criteria:
  - One measurable success condition
non_goals:
  - One explicit non-goal
source_refs:
  - AGENTS.md
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
rollback:
  required: false
  plan_ref: none
verification:
  required: true
  status: not-started
  method_refs: []
execution:
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

Required state rules:

- `mission_id` は directory name と一致させる。
- `mission_origin.type` は Mission の発生源を表す。notification / queue はここにのみ現れる。
- `intake_source` は Mission の入口を表す。chat、external AI output、notification summary は draft input であり、repo artifact に戻るまで正本ではない。
- `path_type` は `scope`、`approval`、`rollback`、`verification` と矛盾させない。
- `approval.required: true` の場合、`approval.gates` は空にしない。
- `rollback.required` は path_type に応じて判断する。DB / migration / production write では原則 required にする。
- `verification.required` は docs-only でも原則 true とし、検証方法は path_type に応じて変える。
- `next_action` は一つの具体的 action に限定する。

## Narrative Sections

以下は human-readable narrative である。Required State を補足するが、state の正本ではない。

## Mission ID

`mission-YYYYMMDD-short-name`

## Title

<!-- Mission の短いタイトルを書く。 -->

## Objective

<!-- この Mission で達成することを書く。front matter の objective と矛盾させない。 -->

## Background

<!-- 背景、依頼元、関連 docs / issue / PR を書く。Human や Sakura を Agent 間通信路にしない。最終状態は repo / GitHub に残す。 -->

## Origin

該当する origin を 1 つ選び、必要な参照だけを書く。

- feature:
- UX:
- refactor:
- research:
- infra:
- ops:
- notification:
- DB:
- security:
- docs:

notification / queue 起点の場合だけ、queue entry を参照する。

- queue entry:
- sanitized intake:
- follow-up source:

## Draft Boundary

Draft input で扱うもの:

- 未確定の仮説。
- research notes。
- option comparison。
- Human / Sakura の違和感や優先順位。

実行可能な Mission に進める条件:

- objective が bounded である。
- path_type が決まっている。
- allowed / prohibited scope が決まっている。
- approval gate の要否が決まっている。
- verification 方針がある。

Draft memo は official Mission state ではない。実行は repo state と Narrative Sections が整ってから行う。

## Source Refs

- `AGENTS.md`
- `docs/product/`
- `docs/ai-team/ai-is-current-state.md`
- `docs/ai-team/ai-is-to-be-architecture.md`

不要なものは削除し、必要な docs だけを残す。

## Success Criteria

-

## Scope

### In Scope

-

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
- `code-pr`
- `db-migration`
- `notification-intake`
- `approval-package`

Path type guidance:

- `docs-only`: docs のみ。rollback は通常 git revert / follow-up docs で足りる。
- `code-pr`: app code を含む。PR、review、QA が必要。
- `db-migration`: DB / RLS / policy / trigger / function / migration。rollback plan と Human approval gate が必要。
- `notification-intake`: sanitized queue / run log / follow-up decision。raw body / secret 保存は禁止。
- `approval-package`: gated operation の判断材料作成。approval なしに execution へ進めない。

## Required Agents

該当するものを残す。

- Parent Agent
- Writer Agent
- Reviewer Agent
- QA Agent
- DB Inspector Agent
- Sakura
- Human

## Approval

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

Approval optionality:

- `docs-only`: 通常は approval 不要。
- `code-pr`: main merge は approval gate。
- `db-migration`: production DB write / migration apply / repair / db push は approval gate。
- `notification-intake`: queue 整理は通常 approval 不要。gated operation 候補は approval package または follow-up Mission に分離する。
- `approval-package`: approval request の作成自体は docs-only。execution は approval 後のみ。

## Rollback

- rollback required: true / false
- rollback plan:
- rollback not required reason:

Rollback optionality:

- `docs-only`: git revert または follow-up docs で足りる場合が多い。
- `code-pr`: PR revert / follow-up patch を書く。
- `db-migration`: rollback SQL または rollback 不能理由を必須とする。
- `notification-intake`: queue status 修正または follow-up correction を書く。
- `approval-package`: approved operation の rollback 方針を含める。

## Verification

- verification required: true / false
- verification method:
- skipped / blocked verification:
- residual risk:

Verification optionality:

- `docs-only`: `git diff --name-only`、`git diff --stat`、`git diff --check`。
- `code-pr`: lint / build / test / UI check など必要な検証。
- `db-migration`: read-only introspection、drift check、post-execution verification。
- `notification-intake`: redaction check、queue status consistency、follow-up consistency。
- `approval-package`: target / risk / rollback / verification completeness。

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

## Validation Checklist

docs-only safe path の初期 validation:

- current branch が想定 branch である。
- working tree に unrelated changes がない。
- changed files が `docs/` 配下のみである。
- staged files が `docs/` 配下のみである。
- file deletion / archive move がない。
- `app/`、`lib/`、`supabase/`、`package.json`、`.env*` が含まれない。
- DB write、`db push`、migration repair、dashboard change がない。
- secret、token、raw external content が保存されていない。
- required docs が存在する。

## Prohibited Content

- secret / token を保存しない。
- raw email body や raw external notification body を保存しない。
- dashboard URL、project ID、内部 ID を不要に保存しない。
- Human に Agent 間通信の転記を依頼しない。
