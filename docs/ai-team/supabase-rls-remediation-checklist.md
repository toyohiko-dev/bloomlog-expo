# Supabase RLS 修正チェックリスト

> Historical note: この文書は過去の RLS 修正チェックリストであり、通常の Codex 開発の正本ではない。
> DB / RLS 作業ではまず `supabase/AGENTS.md` を優先し、必要な場合だけ履歴資料として参照する。

## 目的

`visit_sessions` と `activity_logs` の RLS 警告に対して、repository 側の migration を適用したあとに、人間が確認する項目をまとめる。

このドキュメントは、Bloomlog の外部通知レビューと remediation 作業の補助用であり、dashboard 上の手作業確認を減らすための確認手順書として使う。

## 今回の修正対象

- `public.visit_sessions`
- `public.activity_logs`

今回の migration では、次だけを対象にする。

- RLS を有効化する
- `insert_dev` policy を削除する
- insert policy を `authenticated` 限定かつ `auth.uid() = user_id` 前提へ揃える

次は今回の対象外とする。

- `public.pavilions`
- `public.pavilion_aliases`
- Supabase dashboard 手動変更
- アプリコード変更

## 適用前に確認すること

- dashboard 上で `visit_sessions` と `activity_logs` の RLS が現在 OFF であること
- `visit_sessions_insert_dev` と `activity_logs_insert_dev` が存在すること
- `visit_sessions_select_own` / `update_own` / `delete_own` が残っていること
- `activity_logs_select_own` / `update_own` / `delete_own` が残っていること
- trigger `set_visit_session_user_id` と `set_activity_log_user_id` が存在すること

## 適用後に確認する SQL

### 1. RLS 状態確認

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('visit_sessions', 'activity_logs')
order by tablename;
```

期待値:

- `visit_sessions` の `rowsecurity = true`
- `activity_logs` の `rowsecurity = true`

### 2. policy 一覧確認

```sql
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('visit_sessions', 'activity_logs')
order by tablename, policyname;
```

確認ポイント:

- `visit_sessions_insert_dev` が存在しない
- `activity_logs_insert_dev` が存在しない
- `visit_sessions_insert_own` が `authenticated` 対象になっている
- `activity_logs_insert_own` が `authenticated` 対象になっている
- insert policy の `with_check` が `auth.uid() = user_id` になっている
- select / update / delete policy が消えていない

### 3. trigger 一覧確認

```sql
select
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in ('visit_sessions', 'activity_logs')
order by event_object_table, trigger_name;
```

確認ポイント:

- `visit_sessions` に `set_visit_session_user_id` がある
- `activity_logs` に `set_activity_log_user_id` がある

### 4. trigger 関数定義確認

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('assign_visit_session_user_id', 'sync_activity_log_user_id')
order by p.proname;
```

確認ポイント:

- `assign_visit_session_user_id()` が `new.user_id := auth.uid()` を含む
- `sync_activity_log_user_id()` が `session_id -> visit_sessions.user_id` 整合を確認している

## アプリ観点の確認項目

repository 上の現在の実装では、次の server action が `user_id` を明示して insert している。

- `createSessionAction()`
- `submitActivityLogAction()`

そのため、insert policy を `authenticated` + `auth.uid() = user_id` に戻しても、アプリ側の設計とは整合する想定。

## 適用後の手動テスト観点

### 来場日

- ログイン済みユーザーが来場日を作成できる
- 自分の来場日一覧が見える
- 来場日の更新ができる
- 来場日の削除ができる

### 記録

- ログイン済みユーザーが記録を追加できる
- 自分の記録一覧が見える
- 記録の更新ができる
- 記録の削除ができる

### 異常系

- 未ログイン状態で来場日作成が通らない
- 未ログイン状態で記録作成が通らない
- 他人の `user_id` や `session_id` を使った insert が通らない

## 補足

- 本番 DB への直接 SQL 実行は、人間が明示的に実施する
- dashboard 変更ではなく migration 適用を正とし、実 DB 状態を repository に揃える
- `pavilions` / `pavilion_aliases` は public read master として別途整理する

## 今回の実施結果

- `visit_sessions` と `activity_logs` に対する RLS 修正 SQL は個別適用済み
- `supabase db push` は未実行
- remote migration 履歴が空である問題は別課題として切り分けた
- `visit_sessions` の RLS ON を確認済み
- `activity_logs` の RLS ON を確認済み
- `visit_sessions_insert_dev` の削除を確認済み
- `activity_logs_insert_dev` の削除を確認済み
- `visit_sessions_insert_own` / `activity_logs_insert_own` の insert policy 是正を確認済み
- 来場日作成は動作確認済み
- 思い出作成は動作確認済み

## 今後の残課題

- Supabase migration 運用を正常化する
- remote migration 履歴が空である問題を調査し、repo と実 DB の履歴整合を整理する
- AI が本番 write 直前まで read-only introspection を進め、人間承認後に実行できる運用を固める
- `pavilions` / `pavilion_aliases` の public read 方針と、RLS / policy の整理を別課題として扱う
