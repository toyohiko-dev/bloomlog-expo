# Reviewer Task: rebaseline proposal review

## task id

`task-003-reviewer-operational-rebaseline`

## agent role

Reviewer Agent

## purpose

Operational rebaseline proposal が execution readiness に向かっており、調査ループ、historical purity、silent production write に戻っていないことを確認する。

## input files

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/mission.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/parent.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/db-inspector.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-report.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md`

## required output

Write:

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/reviewer-report.md`

## review checklist

- Proposal adopts current remote schema as operational reality where appropriate.
- Proposal does not require perfect historical reconstruction.
- Proposal does not require full schema parity before action.
- Proposal does not make `db push` the default workflow.
- Proposal does not hide production writes inside docs language.
- Exact operations are present for any write candidate.
- Rollback and verification are operation-specific.
- Blast radius is concrete.
- Approval boundaries are clear.
- Worker / Reviewer / QA do not push.
- Parent remains the only push actor after integration.

## findings format

Use severity:

- blocking
- high
- medium
- low

For each finding include:

- file
- section or line if available
- issue
- required fix

## approval judgment

Classify `approval-needed.md` as one of:

- executable approval draft, pending Human approval
- non-executable draft, needs more concrete operation detail
- unsafe, must be rewritten

## forbidden actions

- Do not execute any Supabase write command.
- Do not push.
- Do not edit DB or migration files.

## completion criteria

- Reviewer report is written.
- Any blocker clearly states the required fix.
- If no blockers, state that Parent may integrate and prepare push after QA.

