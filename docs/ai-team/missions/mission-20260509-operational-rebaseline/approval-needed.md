# Approval Needed: operational rebaseline

## approval id

`approval-20260509-operational-rebaseline`

## mission id

`mission-20260509-operational-rebaseline`

## status

Approval-ready for the selected docs-only operational baseline.

No production write is requested. Do not execute production writes from this file.

## approval type

- production write
- migration repair, only if later selected
- db push, currently rejected as default workflow
- destructive SQL, currently forbidden

## requested action

Approve the selected Option 1 execution package for this Mission:

- adopt current remote schema as the canonical operational source of truth
- abandon perfect historical migration reconstruction as an operational blocker
- keep `db push` out of the default workflow
- keep migration repair out of the default workflow
- use explicit approved SQL / migration proposals for future DB changes
- document accepted drift and future remediation boundaries

This is a docs-only operational baseline approval. It does not approve production SQL, storage policy changes, migration repair, `db push`, destructive SQL, dashboard changes, or secret changes.

## exact command / SQL / setting

Selected execution contains no write operation.

Safe docs/read-only commands:

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

Write operations are not part of the selected package.

Explicitly not approved in this Mission:

```powershell
npx.cmd supabase db push
npx.cmd supabase migration repair --status applied <version>
```

## target environment

- service: Supabase
- app: Bloomlog
- environment: production Supabase operations, but no production write is requested here
- secret handling: do not store project secrets, tokens, or connection strings in docs

## selected remediation package

- selected option: Option 1, documentation-only operational baseline now
- target environment: Bloomlog Supabase operations
- operation type: docs-only operational decision
- exact command / SQL: none for production DB
- expected effect: future Agents use current remote schema as operational reality and stop treating historical migration reconstruction as a blocker
- blast radius: docs / AI operations only
- rollback: revert the docs commit or update this Mission's decision docs
- verification: docs-only diff checks and report consistency
- approval requested from Human: approve docs-only operational baseline direction

## risk

- Adopting remote schema as canonical may permanently abandon some old repo expectations.
- Leaving migration history unrepaired means `db push` remains unsafe as a default workflow.
- Future Agents may accidentally treat future candidates as selected unless this file is read with Parent summary.
- Future production SQL can affect auth / RLS / storage behavior, but no production SQL is selected here.
- Future storage policy changes can affect photo upload behavior, but no storage policy change is selected here.

## rollback

No DB rollback is needed for docs-only baseline creation.

Selected Option 1 rollback:

```text
rollback type: docs revert
target: docs/ai-team/missions/mission-20260509-operational-rebaseline/
exact rollback: revert the commit that introduced the final integration, or edit approval-needed.md / decision-log.md / parent-summary.md to remove the Option 1 selection
data loss risk: none
verification: git diff --name-only; git diff --stat
```

For future write candidates, rollback must be operation-specific:

- migration repair: reverse repair commands or support-assisted recovery, with CLI behavior reconfirmed before execution
- policy change: recreate previous policy definition
- function / trigger restore: `drop trigger if exists ...` and `drop function if exists ...`
- index creation: `drop index if exists ...`, with lock behavior considered
- baseline documentation: revert docs commit

## verification

Selected Option 1 verification:

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --cached --name-only
git diff --cached --stat
```

Expected result:

- changed / staged files are only under `docs/ai-team/missions/mission-20260509-operational-rebaseline/`
- no `app/`, `lib/`, `supabase/`, `supabase/migrations/`, `package.json`, or `.env*` changes
- no production SQL, `migration repair`, `db push`, destructive SQL, dashboard change, or secret change

Future write verification must include:

- `npx.cmd supabase migration list`
- public table / column read-only SQL
- RLS / policy read-only SQL
- trigger / function read-only SQL
- index / constraint read-only SQL
- storage bucket / storage policy read-only SQL
- app-specific smoke checks if any production behavior is changed

## approval options

Human may choose:

- approve selected docs-only operational baseline
- reject selected docs-only operational baseline
- request narrower remediation
- request a future production-write approval package

## approval result

- selected option: pending
- decided by: pending
- decided at: pending
- notes: approval-ready for docs-only operational baseline; no production operation is approved
