# Bloomlog AI-IS Source Map

作成日: 2026-05-10

## 1. Source-of-Truth Mapping

この source map は、現在の working branch `chore/ai-team-state-codex-reconcile` で確認できる AI-IS 関連ファイルの AS-IS mapping である。

Main integration status は `main...chore/ai-team-state-codex-reconcile` の差分を基準に記録する。

| file / directory | current branch | main integration status | role | canonical or draft |
| --- | --- | --- | --- | --- |
| `AGENTS.md` | `chore/ai-team-state-codex-reconcile` | `main` との差分あり | AI Team / Agent OS 作業の唯一の入口。repo 全体ルール。 | entrypoint canonical on branch; not integrated to `main` in this branch state |
| `docs/ai-team/agent-operating-model.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル | AI 開発組織の恒久ルール、role、approval boundary、path type。 | branch canonical |
| `docs/ai-team/mission-lifecycle.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル | Mission state 管理の正本。 | branch canonical |
| `docs/ai-team/agent-docs-map.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル | docs 配置、寿命、archive 条件の supporting reference。 | supporting reference |
| `docs/ai-team/agent-review-workflow.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル | review / approval flow、docs-only commit / push 条件、code PR path、DB path。 | branch canonical for review flow |
| `docs/ai-team/agent-communication-protocol.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル | Agent 間通信媒体、Mission directory structure、handoff protocol。 | branch canonical for communication protocol |
| `docs/ai-team/templates/` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加 directory | Mission / Task / Report / Decision Log / Approval Needed の作成テンプレート。 | canonical templates on branch |
| `docs/ai-team/ops/notification-intake/README.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル、`chore/ai-team-state` との差分あり | Notification Intake Ops の正本入口。 | branch canonical |
| `docs/ai-team/ops/notification-intake/queue.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル、`chore/ai-team-state` との差分あり | Agent Input Queue。pending / triaged / completed / follow-up-created を管理。 | branch canonical |
| `docs/ai-team/ops/notification-intake/template.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル、`chore/ai-team-state` との差分あり | sanitized queue entry template と Codex 更新欄。 | branch canonical template |
| `docs/ai-team/ops/notification-intake/policy.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル | Notification Intake policy。 | branch canonical |
| `docs/ai-team/ops/notification-intake/runs/` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加 directory | Notification intake 実行ログ。 | run records |
| `docs/ai-team/missions/` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加 Mission 群 | Mission artifacts の現行置き場。 | branch records |
| `docs/ai-team/missions/mission-20260509-notification-rls-check/` | `chore/ai-team-state-codex-reconcile` | `main` には未統合、`chore/ai-team-state` には存在しない追加 Mission | NTF-20260509-01 から切り出された read-only DB Inspector follow-up Mission。 | reconcile branch canonical follow-up record |
| `docs/ai-team/missions/*/reports/` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加 report 群 | Writer / Reviewer / QA / DB Inspector / Parent Summary / Execution Report。 | mission records |
| `docs/ai-team/missions/*/decision-log.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加 decision log 群 | Mission 内の判断履歴。 | mission records |
| `docs/ai-team/missions/*/approval-needed.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加 approval package 実例あり | Human approval gate に入る事項の記録。 | approval records |
| `docs/ai-team/supabase-db-introspection.md` | `chore/ai-team-state-codex-reconcile` | `main` との差分あり | DB read-only introspection log / 手順。 | update-type reference |
| `docs/ai-team/supabase-migration-ops.md` | `chore/ai-team-state-codex-reconcile` | `main` には未統合の追加ファイル | DB / migration 作業時の supporting reference。 | supporting reference |
| `docs/ai-team/supabase-rls-remediation-checklist.md` | `chore/ai-team-state-codex-reconcile` | 既存ファイル | RLS remediation checklist。 | short-to-mid term checklist |
| `docs/ai-team/notification-review-log.md` | `chore/ai-team-state-codex-reconcile` | `main` との差分あり | notification review の記録。 | review record |
| `docs/ai-team/notification-review-status.md` | `chore/ai-team-state-codex-reconcile` | `main` との差分あり | notification review の状態記録。 | status record |
| `docs/ai-team/notification-review-policy.md` | `chore/ai-team-state-codex-reconcile` | 既存ファイル | notification review policy。 | policy record |
| `docs/archive/00-charter.md` | `chore/ai-team-state-codex-reconcile` | `docs/ai-team/00-charter.md` から archive へ rename 差分あり | 旧 charter。 | archived |
| `docs/archive/01-parent-brief.md` | `chore/ai-team-state-codex-reconcile` | `docs/ai-team/01-parent-brief.md` から archive へ rename 差分あり | 旧 parent brief。 | archived |
| `docs/archive/2026-05-08-rls-and-agent-ops-handoff.md` | `chore/ai-team-state-codex-reconcile` | `docs/ai-team/2026-05-08-rls-and-agent-ops-handoff.md` から archive へ rename 差分あり | 旧 handoff。 | archived |
| `docs/archive/handoff-2026-04-05.md` | `chore/ai-team-state-codex-reconcile` | `docs/ai-team/handoff-2026-04-05.md` から archive へ rename 差分あり | 旧 handoff。 | archived |
| `docs/ai-team/99-integration-input.md` | `chore/ai-team-state-codex-reconcile` | `main` との差分では deleted | 旧 integration input。 | retired / deleted on branch |

## 2. Branch Topology

現在確認できる branch state:

| branch | current commit | role | state |
| --- | --- | --- | --- |
| `main` | `035b35b docs: formalize AI agent operation principles and RLS remediation handoff` | production canonical branch | `origin/main` と一致する main line。AI-IS の新しい docs 群はまだ main 差分として未統合。 |
| `chore/ai-team-state` | local `42a708d docs: reframe notification intake as ops queue`; remote `6b3e627 docs: create notification rls check mission` | AI Team state 整理 branch | local は `origin/chore/ai-team-state` より 3 commits behind と表示される。remote は notification RLS check Mission 作成 commit まで含む。 |
| `chore/ai-team-state-codex-reconcile` | `00dac22 docs: complete notification rls read-only check` | current reconcile branch | `origin/chore/ai-team-state-codex-reconcile` と一致。`chore/ai-team-state` に加えて queue reconcile と notification RLS read-only check 完了を含む。 |

Observed commit chain:

- `main` is behind the AI-IS work branches.
- `chore/ai-team-state` branch contains the initial AI Team / Agent OS docs and notification intake ops work.
- `origin/chore/ai-team-state` includes `6b3e627 docs: create notification rls check mission`.
- `chore/ai-team-state-codex-reconcile` includes `07db021 docs: reconcile notification queue rls follow-up` and `00dac22 docs: complete notification rls read-only check` after `6b3e627`.

Observed diff relationship:

- `main...chore/ai-team-state-codex-reconcile` includes additions and modifications under `docs/ai-team/`, `docs/archive/`, `docs/README.md`, and `AGENTS.md`.
- `chore/ai-team-state...chore/ai-team-state-codex-reconcile` includes the added `mission-20260509-notification-rls-check/`, updates to notification intake README / queue / template, and a new run log.
- Current working tree before this Mission started had no uncommitted changes.

## 3. Canonical State Analysis

### Production canonical

The production canonical branch is `main`.

Files and state integrated into `main` are production canonical for the repo as a whole. As of this source map, many AI-IS docs exist as branch diffs and are not yet integrated into `main`.

### Branch canonical

Within `chore/ai-team-state-codex-reconcile`, the following are treated as current branch canonical for AI-IS operation:

- `AGENTS.md` as the work entrypoint.
- `docs/ai-team/mission-lifecycle.md` as Mission state canonical.
- `docs/ai-team/agent-operating-model.md` as role and approval boundary canonical.
- `docs/ai-team/agent-review-workflow.md` as review / approval flow canonical.
- `docs/ai-team/agent-communication-protocol.md` as Agent communication protocol canonical.
- `docs/ai-team/ops/notification-intake/README.md` and `queue.md` as Notification Intake canonical.

### Supporting references

The following are supporting references, not the top-level entrypoint:

- `docs/ai-team/agent-docs-map.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/notification-review-policy.md`
- `docs/ai-team/templates/`

### Mission records

The following Mission directories are records of bounded work:

| mission | status in `mission.md` | role |
| --- | --- | --- |
| `mission-20260509-browser-verification-stop` | `completed` | Browser verification stop Mission record. |
| `mission-20260509-notification-intake-workflow` | `completed` | Initial notification intake workflow Mission record. |
| `mission-20260509-notification-intake-ops-reframe` | `completed` | Notification intake reframe as ops queue. |
| `mission-20260509-notification-rls-check` | `completed`; `verification_status: partial` | NTF-20260509-01 read-only DB Inspector follow-up Mission. |
| `mission-20260509-operational-rebaseline` | `completed`; `approval_required: yes`; `approval_status: approved` | Operational rebaseline Mission record. |
| `mission-20260509-supabase-migration-history` | `superseded` | Superseded by operational rebaseline. |

### Reconcile

`chore/ai-team-state-codex-reconcile` is the current reconcile state. It contains the remote `chore/ai-team-state` additions plus Codex reconcile updates for notification intake queue and the notification RLS check Mission.

### Draft / proposal

The current docs contain proposed or non-current structures only where explicitly labeled by the docs:

- Mission lifecycle lists a recommended future-like directory shape under `docs/ai-team/missions/active/`, `completed/`, `blocked/`, `superseded/`, but also states that existing `docs/ai-team/missions/<mission-id>/` remains valid for now.
- Mission / Task / Report / Decision Log templates are canonical templates on the branch, while actual Mission directories are the records for each bounded Mission.
- `docs/archive/` contains archived historical docs and is not the current operating entrypoint.

## 4. Current Directory Strategy

Current active Mission storage is flat:

```text
docs/ai-team/missions/<mission-id>/
```

Within a Mission directory, the AS-IS structure is:

```text
mission.md
tasks/
reports/
decision-log.md
approval-needed.md
```

Not every Mission has every optional file. DB-related or gated Missions may have `approval-needed.md` and DB Inspector reports. Docs-only or workflow Missions may have Writer / Reviewer / QA / Parent reports without DB Inspector artifacts.

Existing Mission directories are not moved merely because the lifecycle doc describes a state-based directory structure. Archive / move is treated as a separate Task.

## 5. Report / Decision Log / Approval Needed Structure

Report structure:

- `reports/writer-report.md`: Writer execution result.
- `reports/reviewer-report.md`: diff review and approval gate assessment.
- `reports/qa-report.md`: validation result and residual risk.
- `reports/db-inspector-report.md`: DB read-only introspection result.
- `reports/parent-summary.md`: Parent integration summary.
- `reports/execution-report.md`: execution report when execution occurs.

Decision log:

- `decision-log.md` records decisions, selected option, rejected alternatives, rationale, effect, residual risk, and final state.

Approval needed:

- `approval-needed.md` records Human approval gate material.
- Existing examples are present in DB / operational Missions.
- Queue-level `Approval Needed Candidates` currently says `まだなし`.

## 6. Verification-Partial Usage

`verification-partial` is an allowed Mission verification state, not an automatic failure.

Current example:

- `mission-20260509-notification-rls-check` has `verification_status: partial`.
- Its residual risk states that the exact Supabase Advisor target is unavailable from sanitized email, and a full public table sweep was blocked by temporary Supabase auth circuit breaker.
- Its next action is conditional: if the Supabase Advisor alert persists, create a new queue entry with sanitized target category and run a narrower read-only follow-up.

## 7. Human Approval Boundary

Human approval is required for:

- main merge.
- migration apply.
- migration repair.
- `db push`.
- destructive SQL.
- secret creation, update, deletion.
- dashboard setting changes.
- production write.
- billing, domain, auth provider, redirect URL, and other production settings.
- large-scale structure changes.

Human approval is not required for:

- docs and code read-only investigation.
- `git status`, `git diff`, `git log`.
- `rg` search.
- repo-internal docs-only changes that satisfy docs-only safe path.
- approved-scope normal code edits.
- lint, build, tests.
- read-only SQL and read-only introspection.
- diff summary, verification plan, rollback plan, report, PR description, handoff, decision log creation.

## 8. Read-Only Introspection Principle

The current principle is that AI performs read-only investigation where possible.

Read-only introspection includes:

- docs and code inspection.
- migration list inspection.
- remote DB schema / RLS / policy / trigger / function / migration history inspection when available without write.
- drift check.
- RLS / policy / trigger / function current-state analysis.
- rollback plan preparation.

The current boundary is that read-only investigation must not store secrets, raw email body, tokens, dashboard URLs, project IDs, or internal IDs in repo docs.
