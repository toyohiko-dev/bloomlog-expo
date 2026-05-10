# Task: Reviewer Check

## task id

`task-003-reviewer-check`

## mission id

`mission-20260510-copy-terminology-audit`

## assigned agent

- Reviewer Agent

## input files

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/current-status.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/mission.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/reviewer.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/writer-report.md`

## target files / target area

Writable target:

- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/reviewer-report.md`

Read-only targets:

- Writer findings
- referenced app / lib / docs/product files

## allowed operations

- read docs / code
- inspect Writer findings
- use `rg` for spot verification
- create or edit `reports/reviewer-report.md`
- inspect diff

## prohibited operations

- edit `app/`
- edit `lib/`
- edit `supabase/`
- edit `migrations/`
- edit `package.json` or lockfiles
- edit `.env*`
- fix UI wording inside this Mission
- ask Human to transfer findings

## review criteria

- Findings are grounded in repo files, not chat memory.
- Fixed terms are checked against `AGENTS.md` and `docs/product/overview.md`.
- Suggested follow-up paths do not violate docs-only scope.
- Product-sensitive wording decisions are separated from obvious consistency fixes.
- No raw external content, secret, dashboard URL, project ID, or internal ID is saved.

## expected output

Update `reports/reviewer-report.md` with:

- accepted findings.
- rejected or downgraded findings.
- missing audit areas.
- approval gate assessment.
- suggested next Mission / PR split.

## completion criteria

- Reviewer can state whether Writer findings are actionable.
- Reviewer can state whether follow-up should be docs-only, code-pr, product-decision, or no-action.
- No app / lib files are changed.

## human intervention required?

no
