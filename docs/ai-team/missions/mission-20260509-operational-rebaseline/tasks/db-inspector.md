# DB Inspector Task: forward operational baseline proposal

## task id

`task-002-db-inspector-operational-baseline`

## agent role

DB Inspector Agent

## purpose

前回 investigation の evidence を使い、Bloomlog Supabase operations の forward-only operational baseline と executable reconciliation proposal を作る。

This task is not an open-ended investigation.

## input files

- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/parent-summary.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `supabase/migrations/`

## required output

Write:

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/db-inspector-report.md`

Update if needed:

- `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`
- `docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md`

## operating assumptions

- Current remote schema is primary operational reality.
- Historical migration purity is not required.
- Full parity with old repo migration expectations is not required before action.
- `db push` remains rejected as default workflow.
- Human approval is required before any production write.

## required report sections

### Operational source of truth

Define what is canonical for future operations:

- current remote schema
- documented accepted drift
- future approved SQL / migrations
- repo docs under this mission

### Canonical remote-only schema

Classify remote-only schema observed in the previous mission:

- `events`
- `areas`
- `countries`
- `spots`
- `pavilions.image_path`
- read-all policies for those tables
- remote-only visit session unique constraints

For each, choose one:

- canonical
- canonical pending explicit approval
- abandon / remove candidate
- unknown but accepted temporarily

### Abandoned old repo expectations

Decide which old expectations should no longer block operations:

- perfect migration history reconstruction
- `db push` as default
- full repo migration replay
- repairing migration history before any future DB operation

Also decide whether missing functions / triggers / indexes are:

- restore candidates
- intentionally abandoned candidates
- future separate approval items

### Concrete remediation strategy

Provide at least two bounded options:

1. Documentation-only operational baseline now.
2. Adopt remote schema as canonical and create a future baseline snapshot / SQL proposal.
3. Optional: targeted SQL remediation for specific missing safety objects, if justified.

Do not propose broad destructive rebuild.

### Exact operations

For each recommended option, include exact operations. Examples:

```powershell
npx.cmd supabase migration list
```

```sql
-- read-only verification example
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

If a production write is proposed, include exact SQL in the report and approval-needed draft, but do not execute it.

### Rollback plan

For every write candidate, include:

- rollback type
- exact rollback SQL / command
- data loss risk
- verification after rollback

### Verification plan

Include read-only verification for:

- migration history state
- canonical tables / columns
- RLS / policies
- triggers / functions
- indexes / constraints
- storage bucket / policies

### Blast radius assessment

Assess:

- app runtime
- auth / RLS
- storage uploads
- future migration workflow
- production DB risk
- rollback complexity

### Execution order

List ordered phases:

1. pre-approval read-only verification
2. Human approval
3. approved operation
4. post-operation read-only verification
5. report / decision-log update

### Approval boundaries

Clearly separate:

- safe docs-only work
- safe read-only commands
- Human approval required writes
- forbidden operations

## explicit forbidden actions

- Do not run `npx.cmd supabase migration repair`.
- Do not run `npx.cmd supabase db push`.
- Do not run production SQL.
- Do not run destructive SQL.
- Do not modify `supabase/migrations/`.
- Do not request secrets.

## completion criteria

- Report contains a recommended path.
- Report contains exact commands / SQL where applicable.
- Report is execution-ready enough for Reviewer / QA to evaluate.
- No section asks for indefinite investigation.

