# Data API grants and rebuild prerequisites

Supabase stops automatically granting access to new public tables on 2026-10-30.
Existing table ACLs remain unchanged. The four edited historical migrations make
application privileges explicit at their existing creation/authentication steps.
`data-api-grants.sql` expresses the complete nine-table application access matrix:

| Table | anon | authenticated | Application / existing design evidence |
| --- | --- | --- | --- |
| events | SELECT | SELECT | lib/sessions.ts getDefaultEventId/listEvents; app/sessions/actions.ts getFixedEventId |
| areas | SELECT | SELECT | lib/sessions.ts listAreas |
| pavilions | SELECT | SELECT | lib/sessions.ts listPavilions/getPavilion |
| pavilion_aliases | SELECT | SELECT | listPavilions nested pavilion_aliases(alias) selection |
| countries | none added | SELECT | No direct query today; existing countries_read_all_authenticated policy |
| spots | none added | SELECT | No direct query today; existing spots_read_all_authenticated policy |
| visit_sessions | none added | SELECT, INSERT, UPDATE, DELETE | lib/sessions.ts reads; app/sessions/actions.ts writes |
| activity_logs | none added | SELECT, INSERT, UPDATE, DELETE | lib/sessions.ts reads; app/sessions/actions.ts writes |
| profiles | none added | SELECT, INSERT, UPDATE | lib/profiles.ts / auth callback reads; app/profile/actions.ts upsert |

The master readers use createPublicSupabaseClient in lib/supabase/shared.ts,
which uses the anon key without session persistence. Hence events/areas/pavilions
and nested aliases need anon SELECT even on signed-in application pages.
Countries/spots authenticated SELECT follows the documented existing policy design
in docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md;
it does not introduce anonymous reads or master writes. This is an application
privilege manifest, not a copy of every existing production ACL (some are broader).

## Execution order and prerequisites

1. Identify a separate disposable/new/preview database. Never use the linked
   production project as a test target. This task does not authorize SQL execution.
2. Restore the reviewed initial schema and policies, then the ordered migrations.
   All nine public tables must exist with RLS enabled and appropriate reviewed
   policies. Schema USAGE and the standard Supabase roles must already exist.
3. Apply data-api-grants.sql as the table owner after those steps. It checks all
   nine tables, RLS and policy existence before any GRANT. Missing prerequisites
   raise an exception; the transaction must be rolled back. It does not validate
   policy semantics, create missing tables, enable RLS, or invent policies.
4. In that disposable database, verify table privileges plus allowed and denied
   row operations for each role. Static checks do not replace this DB verification.

The SQL names every table and privilege explicitly. It adds no service_role access,
sequence grants, automatic default privileges, broad schema-wide grants, or REVOKE.
Existing excessive ACLs are not removed by this file. Historical migrations already
applied are not rerun: do not replay them against production, use db push, or repair
migration history. Production needs no emergency ACL change for this announcement.
The photo cleanup migration and private schema are independent and unchanged.

## Pre-existing rebuild limitation (outside this grant change)

There is no initial CREATE TABLE SQL for visit_sessions, activity_logs, events,
areas, countries, or spots, and no supabase/config.toml. The first migration assumes
activity_logs exists. This migration directory alone cannot bootstrap an empty DB
or support a complete db reset. Obtain and review the missing baseline separately;
this task does not reconstruct it. The grant file now covers all nine tables once
that baseline exists, including the four remote-only master tables.

## Validation

Run node --test tests/supabase-data-api-grants.test.cjs for static checks of the
nine-table privilege matrix, app query coverage and prerequisite ordering.
Also run npm run lint and git diff --check. The grants were executed against
ephemeral PostgreSQL during validation. New provisioning with the complete
Supabase API remains unverified; production grants were not changed.

References:
- https://github.com/orgs/supabase/discussions/45329
- https://supabase.com/docs/guides/api/securing-your-api

## Profiles trigger rebuild parity (2026-10-24 JST)

Read-only inspection of production confirmed public.set_profiles_updated_at()
uses SECURITY INVOKER and SET search_path TO public. The original profiles-creation
SQL now declares both explicitly, so a future rebuild preserves that definition.
This follows the historical-source rebuild approach above; no new production
migration is needed for a setting already present. Do not replay this historical
migration, run db push, or repair history against production. This source edit has
not been applied to any database. Static tests check the declaration and trigger
binding; execution on a rebuilt database remains unverified, and the missing
initial baseline limitation still applies.
