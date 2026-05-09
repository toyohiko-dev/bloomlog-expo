# Decision Log: Gmail Notification Intake Workflow

## decision date

2026-05-09

## decision maker

- Parent Agent

## mission id

`mission-20260509-notification-intake-workflow`

## decision

Gmail に届く Supabase / Vercel / GitHub などの運用通知は、Bloomlog app 本体に組み込まず、AI Team の外部通知レビュー workflow として扱う。

この Mission では実装を行わず、docs-only safe path で Mission artifacts を作成し、取得、分析、承認、実行を分離した workflow と approval gate を定義した。

## state transition

- from: proposed
- to: completed
- changed by: Parent Agent
- reason: docs-only workflow design、Task、Report、Decision Log、safe path verification が完了したため
- blocker: none
- unblock condition: none

## alternatives considered

- Bloomlog app 本体へ Gmail 連携を追加する。
- Gmail API / Apps Script / webhook / cron で自動取得する。
- 既存 `notification-review-*.md` だけに追記し、新規 Mission を作らない。
- 通知ごとに即 code / DB / dashboard 対応へ進む。

## rationale

- AGENTS.md と既存 AI Team docs は、外部通知レビューとアプリ実装を分離する方針を定めている。
- Gmail 連携を app 本体へ入れると、通知処理、secret、運用 UI、DB 保存の責務が Bloomlog の体験記録アプリ本体に混ざる。
- 実メール本文や secret を repo に保存しないため、workflow は sanitized summary と action class を正とする必要がある。
- 本番 write、secret、dashboard、db push、migration repair は Human approval gate で止める必要がある。

## impact

- affected docs:
  - `docs/ai-team/missions/mission-20260509-notification-intake-workflow/`
- affected code:
  - none
- affected DB / migration:
  - none
- affected secret / dashboard:
  - none
- affected operations:
  - 外部通知レビューの今後の intake / classify / repo-check / approval-gate 手順が明確になった。

## follow-up

- 実際の Supabase Gmail 通知を 1 件から数件、read-only で pilot review する。
- pilot ではメール本文全文を保存せず、sanitized summary と action class のみを `notification-review-log.md` に残す。
- DB 対応候補が出た場合は、DB Inspector Agent の read-only Mission へ切り出す。

## revisit condition

- Gmail 連携手段が変わる。
- Vercel / GitHub 通知の分類で provider-specific 項目が不足する。
- 実通知の pilot で action class が曖昧になる。
- Human approval gate の対象が増える。

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human を Agent 間通信路にしない。
