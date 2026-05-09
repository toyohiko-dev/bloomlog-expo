# Notification Intake Policy

作成日: 2026-05-09

## 基本方針

Notification intake は、外部通知を安全に AI ops queue へ入れるための運用である。

Bloomlog app 本体の機能ではない。Gmail 連携、通知 UI、DB 保存、webhook、cron、Apps Script はこの ops の範囲外とする。

## 保存してよいもの

- 受信日または確認日。
- provider。
- sanitized subject summary。
- 通知種別。
- severity。
- action_class。
- Bloomlog への影響候補。
- Codex が見るべき repo / docs / migration / config の候補。
- raw body ではない短い evidence summary。

## 保存しないもの

- raw email body。
- secret / token / API key / OAuth secret。
- magic link / password reset link。
- dashboard URL。
- project ID、account ID、organization ID、内部 ID。
- 請求明細、住所、個人情報。
- セキュリティ通知の全文。

必要な場合も、保存するのは伏せ字化した要約だけにする。

## Approval gate

次は Human approval gate で止める。

- production DB write。
- destructive SQL。
- migration apply。
- `db push`。
- migration repair。
- secret / env / token 変更。
- Supabase / Vercel / GitHub dashboard 変更。
- production setting 変更。
- billing / domain / auth provider / redirect URL 変更。
- main merge。

approval gate 前に Codex が準備するもの:

- 対象。
- exact command / SQL / setting。
- 影響範囲。
- risk。
- rollback。
- verification。
- unknowns。

## 禁止操作

- Gmail API 追加。
- Apps Script 追加。
- webhook 追加。
- cron 追加。
- `service_role` / admin client 追加。
- notification inbox 追加。
- ops dashboard 追加。
- app router / route / page / component 追加。
- `package.json` 変更。
- app / lib / supabase / migrations / env 変更。

## Queue 更新ルール

- Sakura / ChatGPT は `pending` entry を追加できる。
- Codex は pending entry を triaged / completed / follow-up-created / approval-needed-candidate に進める。
- Human は queue の転記係ではない。
- Human approval / rejection があった場合は、Codex が queue、Mission、decision log に反映する。

## Mission 切り出しルール

Queue entry が bounded 対応案件になったら、新規 Mission へ切り出す。

completed Mission は再開しない。既存 Mission の follow-up として新規 Mission を作る。

DB / migration 系は DB Inspector Agent の read-only 調査 Mission にする。write 候補が残る場合は approval-needed を作成して停止する。
