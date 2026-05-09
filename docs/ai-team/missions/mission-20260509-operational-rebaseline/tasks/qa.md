# QA Task: operational rebaseline validation

## task id

`task-004-qa-operational-rebaseline`

## agent role

QA Agent

## purpose

Operational rebaseline proposal が検証可能であり、Human approval 前に実行してよい read-only checks と、approval 後にだけ実行する write checks が分離されていることを確認する。

## input files

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/mission.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/db-inspector.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-report.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/reviewer-report.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md`

## required output

Write:

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/qa-report.md`

## validation scope

Run safe repo / docs checks:

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --cached --name-only
git diff --cached --stat
```

Optional read-only Supabase checks may be run only if already available without secrets and without write:

```powershell
npx.cmd supabase --version
npx.cmd supabase migration list
```

Do not run write commands.

## report checks

Confirm that DB Inspector report includes:

- operational source of truth
- canonical remote-only schema decisions
- abandoned old repo expectations
- concrete remediation strategy
- exact operations
- rollback plan
- verification plan
- blast radius assessment
- execution order
- approval boundaries

Confirm that approval-needed includes:

- requested action
- exact command / SQL / setting
- target environment
- risk
- rollback
- verification
- approval options
- explicit pending Human approval

## skipped validation

Explicitly list skipped validations and reasons, including:

- `db push`
- `migration repair`
- production SQL
- destructive SQL
- dashboard setting change
- secret / token inspection

## completion criteria

- QA report is written.
- No prohibited operation is executed.
- QA says whether Parent may integrate.

