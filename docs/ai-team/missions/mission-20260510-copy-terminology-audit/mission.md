# Mission: Copy / CTA / Page Title / Terminology Read-Only Audit

作成日: 2026-05-10

```yaml
template_version: ai-is-mission-template/v1
mission_id: mission-20260510-copy-terminology-audit
title: Copy / CTA / Page Title / Terminology Read-Only Audit
status: completed
owner_role: Parent Agent
current_phase: finalization
selected_option: complete read-only audit and split implementation decisions into follow-up work
approval_required: no
approval_status: not-required
execution_status: completed
verification_status: passed
residual_risk: copy fixes remain unimplemented by design and require follow-up code-pr or product-decision Mission
next_action: Create follow-up work for obvious collection copy fixes and product decisions for brand casing and fallback wording
last_updated: 2026-05-10
intake_source: conversation
mission_origin:
  type: docs
  ref: user request on 2026-05-10
path_type: docs-only
```

## 目的

Bloomlog 全体の文言、CTA、ページタイトル、固定用語、用語ゆれを read-only で監査する。

この Mission の主目的は、文言監査そのものに加えて、conversation-centric ではなく repo-centric に AI team が協業する運用を試すことである。Human を Agent 間の transport layer にせず、各 Agent が repo 上の Mission artifact を読めば動ける状態を作る。

## 背景

Bloomlog は日本語 UI を前提とするイベント体験記録アプリであり、`docs/product/` と `AGENTS.md` で固定用語が定義されている。

固定用語:

- 来場日
- 思い出
- 思い出アルバム
- タイムライン
- 記録

今回の実験では、app 本体を変更しない。文言監査の結果は report に集約し、必要な修正候補は follow-up Mission または code branch + PR path に切り出す。

## 成功条件

- Writer Agent が `app/` と `lib/` を read-only で確認し、文言、CTA、ページタイトル、固定用語、用語ゆれの候補を `reports/writer-report.md` に整理できる。
- Reviewer Agent が `reports/writer-report.md` を読み、固定用語、`docs/product/`、`AGENTS.md`、変更禁止範囲との整合性を review できる。
- QA Agent が docs-only safe path と report completeness を検証できる。
- Parent Agent が各 report を統合し、次に実装 Mission を切るべきか、docs だけで完了できるかを判断できる。
- Human は Agent 間の転記や diff 確認を行わず、必要な場合だけ follow-up の承認または却下を行う。

## 非目的

- `app/`、`lib/`、`supabase/`、`migrations/`、`package.json`、`.env*` を変更しない。
- UI 文言をこの Mission 内で修正しない。
- route、page、component を追加しない。
- migration、DB write、`db push`、migration repair、dashboard change を行わない。
- secret、token、raw external content を保存しない。
- 文言修正 PR をこの Mission で作らない。

## Source Refs

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/current-status.md`
- `docs/ai-team/ai-is-to-be-architecture.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `docs/ai-team/mission-lifecycle.md`
- `docs/ai-team/templates/mission-template.md`
- `docs/ai-team/templates/task-template.md`
- `docs/ai-team/templates/report-template.md`

## Scope

### In Scope

- `app/**/*.tsx`
- `app/**/*.ts`
- `lib/**/*.ts`
- `docs/product/**/*.md`
- この Mission directory 配下の Task / Report / Decision Log

### Allowed Paths For This Setup

- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/**`

### Read-Only Audit Targets

- `app/`
- `lib/`
- `docs/product/`

### Prohibited Paths For Modification

- `app/**`
- `lib/**`
- `supabase/**`
- `migrations/**`
- `package.json`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `.env*`

## Path Type

`docs-only`

この Mission setup では docs のみを作成する。実際の監査 task は app / lib を read-only で読むが、変更はしない。

## Required Agents

- Parent Agent
- Writer Agent
- Reviewer Agent
- QA Agent

DB Inspector Agent は不要。Sakura review は、文言方針や人間意図の翻訳が必要になった場合だけ optional とする。

## Agent Contract

### Parent Agent

- Mission scope と repo-first 運用を維持する。
- Task と Report の置き場を repo に用意する。
- Writer / Reviewer / QA の report を統合する。
- app / lib の変更が必要になった場合、この Mission では実装せず follow-up Mission または code branch + PR path に切り出す。

### Writer Agent

- `tasks/writer.md` を読んで文言監査を行う。
- `app/` と `lib/` は read-only で確認する。
- Findings は `reports/writer-report.md` に書く。
- 直接文言修正をしない。

### Reviewer Agent

- `tasks/reviewer.md` と `reports/writer-report.md` を読む。
- 固定用語、`docs/product/`、`AGENTS.md` との整合性を確認する。
- Findings の優先度と follow-up 切り出し要否を `reports/reviewer-report.md` に書く。

### QA Agent

- `tasks/qa.md` を読む。
- docs-only safe path、report completeness、prohibited path 非変更を検証する。
- `reports/qa-report.md` に検証結果を書く。

## Approval

Human approval required: no

この Mission は docs-only setup と read-only audit のため、Human approval gate は不要。

Human approval が必要になる条件:

- UI 文言を実際に変更する。
- app / lib / supabase / migrations / package / env を変更する。
- main merge を行う。
- DB write、secret、dashboard、production write が必要になる。

## Rollback

rollback required: false

この Mission setup は docs-only であり、rollback は git revert または follow-up docs 修正で足りる。

## Verification

検証方法:

- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- `git diff --check`
- `git diff --cached --name-only`
- `git diff --cached --stat`
- `git diff --cached --check`

## Output Locations

- mission: `docs/ai-team/missions/mission-20260510-copy-terminology-audit/mission.md`
- tasks:
  - `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/parent.md`
  - `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/writer.md`
  - `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/reviewer.md`
  - `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/qa.md`
- reports:
  - `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/writer-report.md`
  - `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/reviewer-report.md`
  - `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/qa-report.md`
  - `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/parent-summary.md`
- decision log: `docs/ai-team/missions/mission-20260510-copy-terminology-audit/decision-log.md`

## Initial Plan

1. Parent Agent creates Mission artifacts and commits / pushes them via docs-only safe path.
2. Writer Agent performs read-only copy audit and writes `reports/writer-report.md`.
3. Reviewer Agent reviews Writer findings and writes `reports/reviewer-report.md`.
4. QA Agent verifies docs-only state and report completeness, then writes `reports/qa-report.md`.
5. Parent Agent integrates reports in `reports/parent-summary.md` and updates `mission.md` state.

## Final Result

Parent Agent finalized this Mission on 2026-05-10.

Outcome:

- Writer Agent completed the read-only audit.
- Reviewer Agent accepted the main findings and separated code-pr-ready fixes from product-sensitive decisions.
- QA Agent verified docs-only safe path and report completeness.
- No `app/`, `lib/`, `supabase/`, `migrations/`, `package.json`, lockfile, or `.env*` files were changed.
- Human was not used as an Agent transport layer.

Follow-up candidates:

- code-pr: obvious copy fixes in `app/collection/collection-filters.tsx` and `app/collection-next/**`.
- product-decision: official brand casing for `Bloomlog` / `BloomLog`.
- product-decision: fallback wording standard for `名前未設定` / `タイトル未設定` / `未設定`.
- product-decision: date CTA wording around `来場日を開く` / `来場日を作成する`.

## Stop Conditions

- Any Agent needs to edit `app/`, `lib/`, `supabase/`, `migrations/`, `package.json`, or `.env*`.
- A finding requires product wording decision by Human or Sakura before classification.
- A finding implies auth, DB, secret, dashboard, production, or migration impact.
- The audit cannot distinguish between official Bloomlog terminology and implementation-specific labels.
