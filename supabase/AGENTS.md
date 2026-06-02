# Bloomlog Supabase AGENTS

## Scope

このファイルは DB / migration / RLS / policy / trigger / function / Supabase 運用に適用する。

`supabase/` 配下のファイル編集だけでなく、Supabase MCP / Connector を使う project introspection、schema 確認、Security Advisor 確認、SQL verification、本番 DB に関わる targeted SQL apply にも適用する。

root `AGENTS.md` は Bloomlog 全体の入口と横断 gate を定義する。このファイルは Supabase 作業の実務ルールを定義する。

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

## Supabase MCP / Connector 運用原則

Bloomlog では、Supabase MCP / Connector を「read-heavy introspection を主体とする強権ツール」として扱う。

### 基本方針

AI は可能な限り MCP を用いて次を自律的に実施する。

- project introspection。
- schema introspection。
- RLS / policy 確認。
- grants 確認。
- Security Advisor 確認。
- logs 確認。
- read-only SQL verification。

人間を dashboard の確認係・転記係に戻してはいけない。

### 権限上の注意

Supabase MCP の `_execute_sql` は production DB に対して強い権限、postgres 相当で動作する可能性がある。

したがって次を徹底する。

- AI が勝手に production write を実行しない。
- destructive SQL を自動実行しない。
- rollback / blast radius / verification を事前提示する。
- approval gate 後のみ targeted SQL apply を行う。

### Bloomlog における DB 運用原則

Bloomlog は次を優先する。

- remote operational reality。
- targeted SQL apply。
- bounded execution。

以下は原則として行わない。

- `db push`。
- migration repair。
- historical purity pursuit。
- remote migration history investigation loop。

migration は repo state 共有のため保持するが、本番 DB 適用は targeted apply を基本とする。

### 標準フロー

1. AI が MCP で introspection する。
2. AI が impact / rollback / verification を作成する。
3. Human approval を得る。
4. AI が targeted SQL apply を行う。
5. AI が verification / advisor re-check を行う。
