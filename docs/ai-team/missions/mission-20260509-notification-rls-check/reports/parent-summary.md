# Parent Summary: Notification RLS Check

作成日: 2026-05-09

## Current Status

This Mission is `completed`.

It is the canonical Mission created from notification intake queue entry `NTF-20260509-01`.

## Why This Mission Exists

The queue entry describes a Supabase security alert for possible RLS disabled and sensitive columns exposure.

Existing repo docs indicate previous RLS remediation was applied for `visit_sessions` and `activity_logs`, but the latest alert still needs current-state read-only verification before deciding whether it is historical/resolved, still active, or a new issue.

## Reconciliation

Sakura created the canonical remote Mission:

- `docs/ai-team/missions/mission-20260509-notification-rls-check/`

Codex had locally drafted a duplicate Mission:

- `docs/ai-team/missions/mission-20260509-supabase-security-alert-readonly/`

The Codex draft is not adopted as a new Mission. It is replaced by the canonical Mission above, and useful details were integrated into this Mission's `mission.md`, `decision-log.md`, `tasks/db-inspector.md`, and this parent summary.

## What Has Been Done

- Queue entry `NTF-20260509-01` was processed from `pending` to `follow-up-created`.
- This read-only DB Inspector Mission was selected as the canonical follow-up.
- DB Inspector Agent ran read-only Supabase CLI checks and read-only SQL.
- `visit_sessions`, `activity_logs`, `profiles`, and `activity-photos` storage policies were checked.
- No DB write or dashboard operation was performed.

## Findings

- `visit_sessions`: RLS ON, owner-scoped policies present.
- `activity_logs`: RLS ON, owner-scoped policies present.
- `profiles`: RLS ON, owner-scoped policies present.
- `activity-photos` storage: authenticated owner-scoped insert/update/delete policies present.
- `pavilions` and `pavilion_aliases`: RLS OFF, but observed columns are public master/reference data, not user ownership data.
- remote migration history remains not visible to Supabase CLI; `db push` remains unsafe as a standard path.

## What Has Not Been Done

- No `db push` was run.
- No migration repair was run.
- No migration was created.
- No dashboard or credential was changed.
- No app code was changed.
- No production SQL write was executed.

## Final Judgment

`NTF-20260509-01` is treated as historical/resolved for the owner data tables and storage policy that were previously remediated.

No immediate approval-needed package is created.

Residual risk remains because the exact Supabase Advisor target is unavailable from the sanitized queue entry, and one full public table RLS sweep failed due to temporary Supabase auth circuit breaker. If the alert persists, create a new sanitized queue entry with a narrower target category and rerun read-only follow-up.

## Next Action

No immediate remediation. Watch for a new or persistent sanitized Supabase Advisor queue entry.

## Docs-only Safe Path

This Mission remained docs / read-only.

The docs updates are docs-only safe path. The Supabase checks were read-only CLI / SQL.
