# Mission: Supabase operational rebaseline

## mission id

`mission-20260509-operational-rebaseline`

## title

Bloomlog Supabase operations の operational rebaseline

## mission state

```yaml
status: verification-partial
owner_role: Parent Agent
current_phase: verification
selected_option: Option 3 storage policy remediation
approval_required: yes
approval_status: approved
execution_status: completed
verification_status: partial
residual_risk: authenticated app photo upload smoke test is still pending because browser/auth verification was unavailable in the execution environment
next_action: separate authenticated app smoke verification into follow-up and finalize residual risk
last_updated: 2026-05-09
```

## background

前回 Mission `mission-20260509-supabase-migration-history` では、remote migration history が空または unreadable に見える一方で、remote schema には repo migration の主要成果物と remote-only schema が混在していることを確認した。

前回結論は `migration history drift + partial schema drift` であり、`db push`、`migration repair`、個別 production SQL は未実行のまま停止した。

今回の Mission は、追加の open-ended investigation ではない。目的は、完全な historical reconstruction ではなく、現在の remote schema を primary operational reality として扱い、今後の AI-operated development を支える forward-only operational baseline を作ることである。

## operating principle

- current remote schema を primary operational reality として扱う。
- forward operational consistency を historical purity より優先する。
- historical migration history の完全復元は目標にしない。
- `db push` を default workflow として復旧することを目標にしない。
- remote-only schema のうち、現行運用で必要なものは canonical 候補として扱う。
- repo は future operations を安全に行うための operational baseline を持つべきであり、過去の migration history を完全に再現する場所ではない。

## goal

Bloomlog Supabase operations の新しい安定運用 baseline を定義し、Human approval 後に実行できる remediation operations の具体案を作る。

## objectives

- operational source of truth を定義する。
- canonical に採用する remote-only schema を決める。
- 放棄する old repo expectations を決める。
- forward-only operational baseline を設計する。
- executable reconciliation proposals を作る。
- executable approval-needed drafts を作る。
- concrete remediation operations を準備する。

## success criteria

- remote schema を canonical source として採用する範囲が明示されている。
- abandoned expectations が具体的に列挙されている。
- `db push` を default workflow にしない前提の運用ルールが書かれている。
- reconciliation proposal に exact command / SQL、rollback、verification、blast radius、execution order、approval boundaries が含まれている。
- approval-needed draft が Human approval gate に進める形になっている。
- Reviewer / QA が、提案が execution readiness に向いており、追加調査ループに戻っていないことを確認できる。

## scope

- Mission 一式の作成。
- operational rebaseline 方針の定義。
- DB Inspector / Reviewer / QA / Parent task の作成。
- approval-needed draft の作成。
- decision log の作成。
- docs-only safe path での commit / push。

## out of scope

- migration repair の実行。
- `db push` の実行。
- destructive SQL の実行。
- production DB write。
- dashboard setting change。
- secret / token / environment variable の取得、保存、変更。
- `supabase/migrations/` の変更。
- `app/`、`lib/`、`package.json`、`.env*` の変更。
- historical migration history の完全復元。
- open-ended investigation loop。

## allowed direction

- remote schema を canonical として採用する。
- historical migration purity を放棄する。
- `db push` を default workflow から外す。
- migration-history correctness を forward operational consistency に置き換える。
- 新しい operational baseline を作る。
- rollback と verification が明確な場合、broad but bounded reconciliation を提案する。

## forbidden direction

- endless investigation loops。
- perfect historical reconstruction の要求。
- full schema parity before action の要求。
- broad destructive rebuild。
- silent production writes。
- Human approval gate なしの production DB write。
- Worker / Reviewer / QA による push。

## path type

- DB / migration path
- docs-only safe path

## required agents

- Parent Agent
- DB Inspector Agent
- Reviewer Agent
- QA Agent
- Human
- Sakura if policy / human-intent review is requested

## approval gates

Human approval is required before any:

- migration repair
- `db push`
- individual production SQL
- destructive SQL
- production DB write
- dashboard setting change
- secret / environment variable change

No Human approval is required for this docs-only Mission setup.

## push policy

- Worker agents do not push.
- Reviewer / QA do not push.
- Parent pushes after integration.
- Push target is the current work branch unless Parent identifies a blocker.

## output locations

- mission: `docs/ai-team/missions/mission-20260509-operational-rebaseline/mission.md`
- tasks: `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/`
- reports: `docs/ai-team/missions/mission-20260509-operational-rebaseline/reports/`
- approval-needed: `docs/ai-team/missions/mission-20260509-operational-rebaseline/approval-needed.md`
- decision log: `docs/ai-team/missions/mission-20260509-operational-rebaseline/decision-log.md`

## next agent

- Next agent to run: DB Inspector Agent
- Next task file path: `docs/ai-team/missions/mission-20260509-operational-rebaseline/tasks/db-inspector-storage-policy-remediation.md`

## current correction

The documentation-only DB Inspector recommendation is superseded. The current selected execution candidate is Option 3, `activity-photos` storage insert policy remediation.

Do not send the superseded documentation-only package to Reviewer / QA as final.
