# Parent Task: operational rebaseline integration

## task id

`task-001-parent-operational-rebaseline`

## agent role

Parent Agent

## purpose

前回 investigation を再開せず、Bloomlog Supabase operations を execution readiness に向けて統合する。

## input files

- `AGENTS.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/**`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/mission.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/db-inspector.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/reviewer.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/qa.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md`

## execution stance

- Treat previous investigation as sufficient.
- Do not request another broad inventory.
- Ask DB Inspector for reconciliation proposals, not exploratory root-cause hunting.
- Integrate toward a concrete approval gate.
- Stop before production writes.

## required integration

Parent must produce or update `reports/parent-summary.md` after DB Inspector / Reviewer / QA finish.

Parent summary must include:

- selected operational source of truth
- canonical remote-only schema decision
- abandoned repo expectations
- recommended remediation option
- exact operations
- rollback plan
- verification plan
- blast radius assessment
- execution order
- approval boundaries
- whether approval-needed is executable or still draft

## candidate baseline decisions

Parent should start from these defaults unless DB Inspector finds a blocking contradiction:

- Current remote schema is primary operational reality.
- `events`, `areas`, `countries`, `spots`, and `pavilions.image_path` are canonical candidates, not accidental drift by default.
- Missing historical migration history is not repaired for purity alone.
- `db push` is not the default deployment workflow.
- Future DB changes use explicit SQL / migration proposals with Human approval and read-only verification.
- Schema baseline documentation may be created in a later approved task, but this task must not create migration files.

## prohibited actions

- Do not execute `migration repair`.
- Do not execute `db push`.
- Do not execute production SQL.
- Do not create migration files.
- Do not edit `supabase/migrations/`.
- Do not edit app code.
- Do not push before Reviewer / QA reports are integrated.

## completion criteria

- Parent summary is written.
- Decision log is updated with selected direction.
- approval-needed is either:
  - executable draft with exact operations and clear pending Human approval, or
  - explicitly non-executable with the remaining blocker.
- Next task file path is identified.

