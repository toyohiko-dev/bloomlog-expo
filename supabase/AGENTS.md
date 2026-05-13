# Bloomlog Supabase AGENTS

## Scope

このファイルは `supabase/` 配下、DB / migration / RLS / policy / trigger / function / Supabase 運用に適用する。

## 基本原則

- DB 作業は影響が大きいため、read-only 調査を先に行う。
- `supabase/migrations/` と実 DB の差分は慎重に扱う。
- RLS / policy / trigger / function / migration 履歴の確認は、可能な限り read-only で行う。
- migration 履歴が不明な場合、`db push` を通常手段として扱わない。

## 禁止事項

明示依頼または承認なしに、次を行わない。

- migration 作成。
- 本番 DB write。
- destructive SQL。
- `db push`。
- migration repair。
- migration の本番適用。
- dashboard 上の DB / RLS / policy 変更。
- `service_role` / admin client 追加。

## Approval Gate

次が必要になった場合は、実行直前で止まる。

- 本番 DB write。
- destructive SQL。
- `db push`。
- migration repair。
- migration の本番適用。
- dashboard 設定変更。

承認依頼には次を含める。

- 対象 DB / table / policy / trigger / function / migration。
- 実行する SQL または command。
- 想定される影響。
- rollback 方針。
- 実行後の検証方法。
- 不明点と残リスク。

## 調査と検証

- まず repo の `supabase/migrations/` を読む。
- 必要に応じて read-only SQL または read-only CLI で確認する。
- write が必要な候補は、実行せずに影響、risk、rollback、verification を整理する。
- DB 関連の変更後は、可能な範囲で migration 一覧、RLS、policy、アプリ影響を確認する。
