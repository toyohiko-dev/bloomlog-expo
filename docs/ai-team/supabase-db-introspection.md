# Supabase 実 DB 参照手順

## 目的

Bloomlog で Supabase の実 DB 状態を確認するときに、dashboard のスクリーンショットに依存せず、Codex と人間が同じ前提で read-only 調査できるようにする。

このドキュメントは、repository 側で再現できる参照手順だけを扱う。

今回の対象:

- remote project と local repo の対応確認
- migration ファイルの確認
- RLS / policy / trigger / function の read-only 調査

今回の対象外:

- migration 適用
- 本番 DB への書き込み
- dashboard 変更
- SQL Editor からの更新

## 現在の repo 状態

現在確認できる状態は次のとおり。

- `supabase/` ディレクトリは存在する
- `supabase/migrations/` は存在する
- `supabase/config.toml` は存在しない
- この端末では `supabase` CLI は未導入

そのため、今後 Codex が Supabase を参照するためには、まず人間が CLI 利用前提を整える必要がある。

## Codex が今後どう Supabase を参照するか

基本方針は次のとおり。

1. repository 上の `supabase/migrations/` を確認する
2. 人間が用意した Supabase CLI 環境を使って remote project を read-only で参照する
3. 実 DB の状態と migration 定義の差分を比較する
4. 差分があっても、承認前に `db push` や SQL 実行は行わない

Codex は次の順序で参照する。

- `supabase/migrations/` を読む
- `supabase link` の前提が整っているか確認する
- read-only SQL を使って schema / policy / trigger / function を確認する
- 必要なら差分の整理だけを返す

## 人間が最初に用意すべきもの

### 1. Supabase CLI

この端末では `supabase` コマンドが未導入だった。  
まず人間が Supabase CLI をインストールし、PowerShell から `supabase --version` が通る状態にする。

### 2. Supabase へのログイン状態

人間が対話的に次を実行できる状態を用意する。

```powershell
supabase login
```

Codex はブラウザログインやトークン入力を代行しない前提とする。

### 3. remote project の識別情報

少なくとも次が必要。

- project ref
- 参照対象プロジェクトが Bloomlog 本番なのか開発用なのか

例:

- `xavnxklqsupkosmywojn`

### 4. `supabase/config.toml` の扱い

この repo には現時点で `supabase/config.toml` がない。  
そのため、CLI の一部機能は link や init 前提になる可能性がある。

ただし、安易に `supabase init` で新規生成するとローカル設定ファイルが増えるため、最初は次の方針を取る。

- まず docs に手順を残す
- 実際の link / init は人間承認後に行う
- 生成された設定ファイルを commit するかは別途判断する

## 安全な前提確認手順

### 1. repo の migration 一覧確認

```powershell
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
```

用途:

- repository 側の schema 変更履歴を確認する
- 実 DB 差分調査の起点にする

### 2. Supabase CLI の存在確認

```powershell
supabase --version
```

用途:

- CLI が利用可能か確認する

### 3. remote project との link 確認

`supabase link` は project への紐づけ操作であり、通常は DB 書き込み自体は行わないが、local 設定を生成・更新する可能性がある。  
そのため、初回実行は人間承認の上で行う。

想定コマンド:

```powershell
supabase link --project-ref <PROJECT_REF>
```

注意:

- これは migration 適用ではない
- ただし local 側の設定ファイル変更が起こりうる
- 実行前に `git status` を確認する

## read-only で確認できる項目

以下は、実 DB に書き込まずに確認したい項目。

- 対象テーブルの RLS ON / OFF
- policy 一覧
- policy の対象 role
- `using` / `with check` 条件
- trigger 一覧
- trigger が呼ぶ function
- function 定義
- 対象テーブルの列一覧
- `user_id` の有無
- relation の有無

## read-only SQL テンプレート

以下の SQL は参照専用で、書き込みを行わない。

### 1. 対象テーブルの RLS 状態

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'visit_sessions',
    'activity_logs',
    'pavilions',
    'pavilion_aliases'
  )
order by tablename;
```

### 2. policy 一覧

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
  and tablename in (
    'visit_sessions',
    'activity_logs',
    'pavilions',
    'pavilion_aliases'
  )
order by tablename, policyname;
```

### 3. trigger 一覧

```sql
select
  event_object_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
from information_schema.triggers
where event_object_schema = 'public'
  and event_object_table in (
    'visit_sessions',
    'activity_logs',
    'pavilions',
    'pavilion_aliases'
  )
order by event_object_table, trigger_name;
```

### 4. function 定義

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'assign_visit_session_user_id',
    'sync_activity_log_user_id'
  )
order by p.proname;
```

### 5. 列一覧

```sql
select
  table_schema,
  table_name,
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'visit_sessions',
    'activity_logs',
    'pavilions',
    'pavilion_aliases'
  )
order by table_name, ordinal_position;
```

### 6. foreign key 一覧

```sql
select
  tc.table_schema,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name,
  ccu.table_schema as foreign_table_schema,
  ccu.table_name as foreign_table_name,
  ccu.column_name as foreign_column_name
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in (
    'visit_sessions',
    'activity_logs',
    'pavilions',
    'pavilion_aliases'
  )
order by tc.table_name, tc.constraint_name;
```

## CLI 利用時の運用ルール

### やってよいこと

- `supabase --version`
- `supabase login`
- `supabase link --project-ref ...`
- migration ファイルの確認
- read-only SQL の準備
- 実 DB 状態と migration 定義の差分整理

### 書き込みが発生する操作と禁止事項

次は書き込みや本番変更につながるため、明示承認なしでは行わない。

- `supabase db push`
- `supabase migration up`
- `supabase db reset`
- `supabase db remote commit`
- SQL による `create / alter / drop / insert / update / delete`
- SQL Editor での更新
- dashboard 上の policy / RLS 変更

補足:

- `supabase link` は本番 DB 更新ではないが、local 設定変更の可能性がある
- そのため、`link` も作業前に人間へ明示する

## Codex が次回以降に参照するときの基本手順

1. `git status` を確認する
2. `supabase/config.toml` の有無を確認する
3. CLI の有無を確認する
4. migration 一覧を確認する
5. link 済みかを確認する
6. read-only SQL で RLS / policy / trigger / function を確認する
7. 差分を docs または回答で整理する

## 今回やっていないこと

- 実 DB 変更
- migration 適用
- dashboard 変更
- `.env` への秘密情報追記
- `package.json` の変更
- `app/` / `lib/` の変更

今回の作業は、Supabase 実 DB を read-only で参照するための手順整理のみ。
