# Approval Needed: operational rebaseline

## approval id

`approval-20260509-operational-rebaseline`

## mission id

`mission-20260509-operational-rebaseline`

## status

Draft. Not approved. Do not execute production writes from this file until Human approval is recorded.

## approval type

- production write
- migration repair, only if later selected
- db push, currently rejected as default workflow
- destructive SQL, currently forbidden

## requested action

Prepare, review, and approve a forward-only operational baseline for Bloomlog Supabase operations.

The default requested action for execution should be one bounded remediation package selected by Parent after DB Inspector / Reviewer / QA:

- adopt current remote schema as canonical operational source of truth
- abandon perfect historical migration reconstruction
- keep `db push` out of the default workflow
- use explicit approved SQL / migration proposals for future DB changes
- document accepted drift and future remediation boundaries

## exact command / SQL / setting

Current draft contains no approved write operation.

Safe read-only pre-approval commands:

```powershell
git status --short
git diff --name-only
git diff --stat
npx.cmd supabase migration list
```

Safe read-only verification SQL examples:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

```sql
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

Write operations must be filled in by DB Inspector before this becomes executable.

Explicitly not approved:

```powershell
npx.cmd supabase db push
npx.cmd supabase migration repair --status applied <version>
```

## target environment

- service: Supabase
- app: Bloomlog
- environment: production suspected; must be confirmed before any write
- secret handling: do not store project secrets, tokens, or connection strings in docs

## proposed remediation package template

DB Inspector must fill this before Human approval:

```text
selected option:
target environment:
operation type:
exact command / SQL:
expected effect:
blast radius:
rollback:
verification:
approval requested from Human:
```

## risk

- Adopting remote schema as canonical may permanently abandon some old repo expectations.
- Leaving migration history unrepaired means `db push` remains unsafe as a default workflow.
- Repairing migration history without schema remediation may hide real drift.
- Creating a new baseline without clear rollback may make future operations harder to audit.
- Any production SQL can affect auth / RLS / storage behavior.
- Any storage policy change can affect photo upload behavior.

## rollback

No rollback is needed for docs-only baseline creation.

For future write candidates, rollback must be operation-specific:

- migration repair: reverse repair commands or support-assisted recovery, with CLI behavior reconfirmed before execution
- policy change: recreate previous policy definition
- function / trigger restore: `drop trigger if exists ...` and `drop function if exists ...`
- index creation: `drop index if exists ...`, with lock behavior considered
- baseline documentation: revert docs commit

## verification

Verification must include:

- `npx.cmd supabase migration list`
- public table / column read-only SQL
- RLS / policy read-only SQL
- trigger / function read-only SQL
- index / constraint read-only SQL
- storage bucket / storage policy read-only SQL
- app-specific smoke checks if any production behavior is changed

## approval options

Human may choose:

- approve selected remediation package
- reject selected remediation package
- request narrower remediation
- request docs-only baseline only

## approval result

- selected option: pending
- decided by: pending
- decided at: pending
- notes: no production operation is approved yet

