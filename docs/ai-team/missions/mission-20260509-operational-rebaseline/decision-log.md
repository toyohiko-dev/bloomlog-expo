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

---

## decision date

2026-05-09

## decision maker

- Parent Agent

## mission id

`mission-20260509-operational-rebaseline`

## decision

Finalize the Mission in execution-readiness integration phase with **Option 1 only for this Mission: documentation-only operational baseline now**.

The Mission is approval-ready for docs-only operational baseline adoption. It does not request or approve production SQL, storage policy changes, migration repair, `db push`, destructive SQL, dashboard changes, or secret changes.

## selected execution package

- Adopt current remote schema as the operational source of truth.
- Accept remote-only schema classifications from the DB Inspector report.
- Abandon perfect historical migration reconstruction as an operational blocker.
- Keep `db push` out of the default workflow.
- Keep migration repair out of the default workflow.
- Route future DB changes through explicit approved SQL / migration proposals with rollback and verification.

## alternatives considered

- Option 2: future docs-only remote schema baseline snapshot.
- Option 3: future targeted storage insert policy SQL.
- migration repair.
- `db push`.
- reopening drift analysis.

## rationale

- DB Inspector recommended Option 1.
- Reviewer judged Option 1 ready with only wording fixes.
- QA judged Option 1 consistent with only wording fixes.
- Option 2 and Option 3 are useful future candidates but are not selected execution paths in this Mission.
- No additional investigation is needed to adopt a docs-only operational baseline.

## rollback

Selected rollback is docs revert only:

```text
rollback type: docs revert
target: docs/ai-team/missions/mission-20260509-operational-rebaseline/
data loss risk: none
verification: git diff --name-only; git diff --stat
```

## verification

Final verification for this Mission is docs-only diff verification:

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --cached --name-only
git diff --cached --stat
```

## approval boundary

No Human approval is required for this docs-only execution.

Human approval is still required before:

- production SQL
- storage policy change
- migration repair
- `db push`
- destructive SQL
- dashboard setting change
- secret / environment variable change

## impact

- affected docs:
  - `docs/ai-team/missions/mission-20260509-operational-rebaseline/`
- affected code: none
- affected DB / migration: none
- affected secret / dashboard: none

## follow-up

If a future production write is needed, start from a new bounded approval package. Do not reopen broad drift analysis.
