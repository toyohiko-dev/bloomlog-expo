# Mission: Notification Intake Ops Reframe

作成日: 2026-05-09

```yaml
status: completed
owner_role: Parent Agent
current_phase: finalization
selected_option: create ops notification-intake directory and queue
approval_required: no
approval_status: not-required
execution_status: completed
verification_status: passed
residual_risk: actual Gmail connector behavior and read-only DB Inspector follow-up remain unexecuted
next_action: Create a bounded read-only DB Inspector Mission for NTF-20260509-01
last_updated: 2026-05-09
```

## 目的

前回の `mission-20260509-notification-intake-workflow` を、一回限りの開発 Mission ではなく継続的な AI ops job として運用できる形に見直す。

## 背景

Gmail 起点の notification intake は、継続的に発生する外部通知を扱うため、`missions/` 直下の単発 Mission だけに閉じると毎回長いチャット指示が必要になる。

今後は `docs/ai-team/ops/notification-intake/` を正本入口とし、queue の pending entry を Codex が処理する運用にする。

## 成功条件

- Notification intake ops の入口 docs がある。
- policy、template、queue、runs の最小構成がある。
- Sakura / ChatGPT、Codex、Human の責務が明記されている。
- Ops と Mission の境界が明確である。
- Ops から Mission へ切り出す条件が明記されている。
- Sakura Gmail read-only pilot の候補が raw body なしの sanitized entry として queue にある。
- docs-only safe path で commit / push できている。

## scope

- `docs/ai-team/ops/notification-intake/` の新規 docs。
- `docs/ai-team/notification-review-log.md` の入口更新。
- この follow-up Mission の artifacts。

## out of scope

- app code。
- `lib/`。
- `supabase/`。
- migrations。
- `package.json`。
- `.env*`。
- Gmail API、Apps Script、webhook、cron。
- DB write、`db push`、migration repair。
- dashboard / secret 変更。

## path type

- docs-only safe path

## required agents

- Parent Agent
- Writer Agent
- Reviewer Agent
- QA Agent

## approval gates

- approval required: no
- approval type: none
- approval reason: docs-only ops design のため。

Human approval が必要になる条件:

- `NTF-20260509-01` などを起点に DB write、dashboard 変更、secret 変更、`db push`、migration repair が必要になる。
- code change を実行する。
- production setting を変更する。

## target branch

`chore/ai-team-state`

## output locations

- ops docs: `docs/ai-team/ops/notification-intake/`
- mission: `docs/ai-team/missions/mission-20260509-notification-intake-ops-reframe/mission.md`
- reports: `docs/ai-team/missions/mission-20260509-notification-intake-ops-reframe/reports/`
- decision log: `docs/ai-team/missions/mission-20260509-notification-intake-ops-reframe/decision-log.md`

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human に Agent 間通信の転記を依頼しない。
- Gmail 連携を Bloomlog app 本体に組み込まない。
