# Task: QA Validation

## task id

`task-004-qa-validation`

## mission id

`mission-20260510-copy-terminology-audit`

## assigned agent

- QA Agent

## input files

- `AGENTS.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/mission.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/qa.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/writer-report.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/reviewer-report.md`

## target files / target area

Writable target:

- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/qa-report.md`

Read-only targets:

- Mission artifacts
- git diff
- referenced app / lib files

## allowed operations

- read docs / code
- inspect diff
- run validation commands
- create or edit `reports/qa-report.md`

## prohibited operations

- edit `app/`
- edit `lib/`
- edit `supabase/`
- edit `migrations/`
- edit `package.json` or lockfiles
- edit `.env*`
- run DB write commands
- run migration repair or db push
- change dashboard or secret

## commands allowed

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --check
git diff --cached --name-only
git diff --cached --stat
git diff --cached --check
rg --files app lib docs/product docs/ai-team/missions/mission-20260510-copy-terminology-audit
```

## validation criteria

- docs-only safe path remains true.
- `app/`, `lib/`, `supabase/`, `migrations/`, `package.json`, `.env*` are unchanged.
- report files exist and contain enough information for Parent Agent integration.
- Writer report includes inspected files and findings classification.
- Reviewer report includes approval gate assessment.
- no Human transport layer is required.

## expected output

Update `reports/qa-report.md` with:

- commands run.
- docs-only safe path result.
- report completeness result.
- prohibited path check.
- residual risk.
- next action.

## completion criteria

- QA can recommend whether Parent Agent may finalize the Mission.
- Any missing report or validation is listed as residual risk, not sent back to Human for manual transfer.

## human intervention required?

no
