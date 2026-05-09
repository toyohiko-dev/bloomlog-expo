# Decision Log

## decision date

2026-05-09

## decision maker

- Parent Agent

## mission id

`mission-20260509-operational-rebaseline`

## decision

Create a new operational rebaseline Mission for Bloomlog Supabase operations.

This Mission shifts the Agent OS state from investigation mode to operational rebaseline mode. Previous investigation is sufficient. Future work should move toward approval-ready reconciliation proposals and should not continue open-ended historical reconstruction.

## selected direction

- Treat current remote schema as the primary operational reality.
- Prioritize forward operational consistency over perfect historical migration reconstruction.
- Stop treating migration history repair as automatically required.
- Keep `db push` out of the default workflow until an explicit future decision changes that.
- Prepare bounded remediation operations with exact commands / SQL, rollback, verification, blast radius, execution order, and approval boundaries.

## alternatives considered

- Continue investigating until historical migration history is perfectly reconstructed.
- Require full schema parity before any action.
- Repair all migration history first.
- Use `db push` as the standard recovery path.
- Rebuild broad portions of production schema.

## rationale

- Previous Mission established that the issue is not pure `history-only drift`; it is `migration history drift + partial schema drift`.
- Remote schema contains operationally significant remote-only elements.
- Historical purity does not directly improve future operational safety.
- `db push` may treat old migrations as pending and remains unsafe as a default workflow.
- Forward baseline, explicit approval, rollback, and verification better match AI-operated development needs.

## impact

- affected docs:
  - `docs/ai-team/missions/mission-20260509-operational-rebaseline/`
- affected code: none
- affected DB / migration: none in this setup step
- affected secret / dashboard: none
- affected operations:
  - next work shifts to execution-readiness proposals
  - DB Inspector must produce concrete remediation strategy
  - Reviewer / QA must prevent regression into investigation loops

## approval boundary

This docs-only Mission setup does not require Human approval.

Human approval is required before:

- migration repair
- `db push`
- production SQL
- destructive SQL
- production DB write
- dashboard setting change
- secret / environment variable change

## follow-up

- Next agent to run: DB Inspector Agent
- Next task file path: `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/db-inspector.md`

## revisit condition

- DB Inspector produces a selected remediation option.
- Reviewer or QA finds a blocker.
- Human asks to approve or reject a concrete operation.
- A future task proposes restoring `db push` as a default workflow.

