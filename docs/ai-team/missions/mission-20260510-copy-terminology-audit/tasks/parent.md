# Task: Parent Integration

## task id

`task-001-parent-integration`

## mission id

`mission-20260510-copy-terminology-audit`

## assigned agent

- Parent Agent

## input files

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/current-status.md`
- `docs/ai-team/mission-lifecycle.md`
- `docs/ai-team/agent-docs-map.md`
- `docs/ai-team/ai-is-to-be-architecture.md`
- `docs/ai-team/templates/mission-template.md`
- `docs/ai-team/templates/task-template.md`
- `docs/ai-team/templates/report-template.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/mission.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/writer.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/reviewer.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/qa.md`

## target files / target area

- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/`

## allowed operations

- read docs
- create docs
- edit this Mission directory
- inspect diff
- run validation commands
- create or update reports
- commit / push after docs-only safe path verification

## prohibited operations

- `app/` changes
- `lib/` changes
- `supabase/` changes
- `migrations/` changes
- `package.json` or lockfile changes
- `.env*` changes
- DB write
- migration repair
- db push
- dashboard change
- UI wording fixes inside this Mission

## commands allowed

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --check
git diff --cached --name-only
git diff --cached --stat
git diff --cached --check
rg --files app lib docs/product
```

## expected output

- Mission artifacts are present.
- Each Agent can continue by reading repo files only.
- Final parent summary integrates Writer / Reviewer / QA results.

## completion criteria

- docs-only safe path yes.
- Human is not used as transport layer.
- app / lib / supabase / migrations / package / env are unchanged.
- pushed yes / no is recorded in final report.

## human intervention required?

no

Human intervention becomes yes only if a follow-up wording implementation, main merge, production operation, DB operation, secret, or dashboard change is requested.
