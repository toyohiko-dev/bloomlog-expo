# Decision Log: Notification Intake Ops Reframe

## decision date

2026-05-09

## decision maker

- Parent Agent

## mission id

`mission-20260509-notification-intake-ops-reframe`

## decision

Notification intake は、単発 Mission ではなく継続 AI ops job として扱う。

今後の正本入口は `docs/ai-team/ops/notification-intake/README.md` とし、queue は `docs/ai-team/ops/notification-intake/queue.md` に置く。既存 `notification-review-log.md` は互換入口として ops queue を指す。

## state transition

- from: proposed
- to: completed
- changed by: Parent Agent
- reason: ops docs、queue、template、policy、run log、follow-up Mission report が作成され、docs-only validation が通ったため
- blocker: none
- unblock condition: none

## alternatives considered

- 前回 completed Mission を直接更新して再開する。
- `notification-review-log.md` だけを queue に変える。
- `missions/` 配下だけで継続運用する。
- app 本体へ notification inbox / ops dashboard を作る。

## rationale

- completed Mission は再開しないという lifecycle に従うため、follow-up Mission を作る。
- queue を ops directory に分けると、長いチャット指示に依存せず Codex が読む入口を固定できる。
- `notification-review-log.md` だけを拡張すると、policy、template、runs、queue state が混ざる。
- app 本体への通知機能追加は AGENTS.md の禁止事項に該当し、Bloomlog の責務を広げすぎる。

## impact

- affected docs:
  - `docs/ai-team/ops/notification-intake/`
  - `docs/ai-team/notification-review-log.md`
  - `docs/ai-team/missions/mission-20260509-notification-intake-ops-reframe/`
- affected code:
  - none
- affected DB / migration:
  - none
- affected secret / dashboard:
  - none
- affected operations:
  - Codex への今後の指示を短くできる。
  - Sakura / ChatGPT、Codex、Human の責務が明確になる。
  - DB/security 系通知は queue から read-only follow-up Mission へ切り出せる。

## follow-up

- `NTF-20260509-01` の Supabase security alert について、read-only DB Inspector Mission を新規作成する。
- read-only 調査後、write や dashboard 変更が必要なら approval-needed.md を作成して停止する。

## revisit condition

- Gmail 連携の実取得形式が template と合わない。
- Vercel / GitHub の通知で queue status や action_class が不足する。
- queue の量が増えて分割、archive、index が必要になる。

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human を Agent 間通信路にしない。
