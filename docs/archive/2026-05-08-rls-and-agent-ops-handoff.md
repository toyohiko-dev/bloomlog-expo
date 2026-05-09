# 2026-05-08 RLS と AI Agent 運用引き継ぎ

## 概要

今回の作業では、Supabase Security Advisor で検出された RLS 警告への対応と、それを通じて見えた AI Agent 運用上の課題を整理した。

このドキュメントは、次チャット以降で同じ問題を繰り返さないための handoff である。

## 今回の RLS 問題の発端

- Supabase Security Advisor で `visit_sessions` と `activity_logs` に RLS 警告が出た
- 対象テーブルは Bloomlog 上で user private data に当たる
- migration には `auth.uid() = user_id` 前提の設計がある一方、実 DB 側では RLS disabled が確認された

## 発見した問題

### 1. RLS disabled

- `public.visit_sessions` は RLS disabled
- `public.activity_logs` は RLS disabled

### 2. 緩い insert policy

- `insert_dev` policy が残っていた
- 内容は `to anon, authenticated / with check (true)` で、意図より緩かった

### 3. remote migration 履歴が空

- Supabase CLI の `migration list` では remote 側の履歴が空に見えた
- そのため `supabase db push` を使うと、今回の 1 本だけではなく local の全 migration が本番適用対象に見える状態だった
- read-only 調査では `supabase_migrations` schema 自体が見当たらず、CLI が参照する migration 管理履歴が remote 側に存在しない可能性が高い
- `auth.schema_migrations` などの内部用テーブルは存在したが、repo の migration 履歴とは一致しなかった

## 実施済み対応

- RLS 修正 SQL を個別適用した
- `visit_sessions` の RLS ON を確認した
- `activity_logs` の RLS ON を確認した
- `visit_sessions_insert_dev` の削除を確認した
- `activity_logs_insert_dev` の削除を確認した
- insert policy を `authenticated + auth.uid() = user_id` 前提へ是正した
- 来場日作成の動作確認を行い、成功を確認した
- 思い出作成の動作確認を行い、成功を確認した
- `supabase/.temp` は `.gitignore` で無視される状態を確認した

## 実施しなかったこと

- `supabase db push`
- 全 migration の本番適用
- dashboard 手動変更
- SQL Editor での広範囲な手動運用

## 未解決課題

- Supabase migration 運用正常化
- remote migration 履歴が空である問題の整理
- AI が本番 write 直前まで調査を進め、人間承認後に実行できる運用設計

補足:

- read-only の spot check では、主要テーブルと主要カラムは remote 側に存在していた
- `profiles.display_name` があり `profiles.nickname` がないため、schema は repo の後半 migration に概ね追随している可能性が高い
- そのため、主問題は schema 不一致より migration 履歴管理の欠落にある可能性が高い

## 今後の最優先方針

- 人間を確認係にしない
- Codex / AI Agent に read-only introspection をさせる
- 人間は承認者に徹する

補足:

- AI は migration、lint、build、差分整理、read-only SQL 準備、検証観点整理を担当する
- 人間承認が必要なのは、本番 DB write、destructive SQL、secret 変更、dashboard 設定変更のみ

## 次にやるべきこと

1. Supabase remote migration 履歴が空に見える理由を調査する
2. repo 側 migration と実 DB 側の履歴整合を、read-only で棚卸しする
3. `db push` を安全に使える運用か、個別適用を標準にするかを判断する
4. AI が本番 write 直前まで進めて、人間が承認だけ行う運用ルールをさらに明文化する

## 次の判断材料

- `npx supabase migration list` は remote 列が空
- `supabase_migrations` schema は remote 側に見当たらない
- この状態では `db push` は今回の remediation に対して過剰で危険
- 主要テーブルと主要カラムの spot check では schema 自体は大きく崩れていない
- 将来的な候補操作として `supabase migration repair` はあるが、これは write を伴うため別承認タスクに切り出す
- 次の優先タスクは、本番 DB の migration 履歴管理を read-only で棚卸しし、今後の標準適用手段を決めること
