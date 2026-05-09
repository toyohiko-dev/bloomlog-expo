# Supabase Migration Ops

作成日: 2026-05-09

## 目的

このドキュメントは、Bloomlog の remote migration 履歴空問題を AI チーム運用で安全に扱うための supporting reference である。

AI Team / Agent OS 作業の入口は `AGENTS.md` である。このファイルは入口ではなく、DB / migration 作業で必要になった場合にだけ読む。

DB / migration に関する実行ルールは `docs/ai-team/agent-operating-model.md`、review / approval flow は `docs/ai-team/agent-review-workflow.md`、Agent 間通信は `docs/ai-team/agent-communication-protocol.md`、read-only 参照手順の具体例は `docs/ai-team/supabase-db-introspection.md` に従う。

## 基本原則

- Human は承認者であり、SQL 組み立て係、diff 確認係、dashboard 目視確認係ではない。
- DB Inspector Agent は read-only 調査、差分整理、repair 候補表、rollback 案、approval-needed 案まで作る。
- 本番 DB write、migration repair、`db push`、destructive SQL は Human approval gate なしに実行しない。
- remote migration 履歴が空または欠落している間、`db push` を標準手段にしない。
- secret、token、メール本文全文を docs に保存しない。
- DB / migration の判断材料はチャットに閉じず、repo files / branch / PR / issue に残す。

## DB Inspector Agent の責務

DB Inspector Agent は DB / migration path の主担当である。

担当すること:

- `supabase/migrations/` を読む。
- remote schema を read-only introspection する。
- RLS / policy / trigger / function / migration 履歴を read-only で確認する。
- repo migration と remote schema の差分を整理する。
- remote migration history が空または欠落している場合の切り分けを行う。
- `migration repair` 候補表を作る。
- `db push` を使ってよいか、使ってはいけないかを判断材料として整理する。
- 個別 SQL 適用を検討する条件を整理する。
- rollback plan を作る。
- approval request に exact command / SQL / risk / rollback / verification を含める。

担当しないこと:

- Human approval gate 前の DB write。
- Human approval gate 前の migration repair。
- Human approval gate 前の `db push`。
- Human approval gate 前の destructive SQL。
- secret の取得、保存、転記。

## read-only introspection の標準手順

標準手順:

1. `git status --short` を確認する。
2. `supabase/config.toml` の有無を確認する。
3. `npx supabase --version` を確認する。
4. `supabase/migrations/` の一覧を確認する。
5. remote link 状態を確認する。
6. remote migration history の見え方を確認する。
7. remote schema の主要 table / column を確認する。
8. RLS / policy / trigger / function を確認する。
9. repo migration と remote schema の差分を整理する。
10. Report に commands run、結果、unknowns、risk、rollback、approval required を書く。

標準コマンド例:

```powershell
git status --short
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
npx supabase --version
npx supabase migration list
```

read-only SQL 例:

```sql
select schema_name
from information_schema.schemata
where schema_name in ('supabase_migrations', 'auth', 'realtime', 'storage')
order by schema_name;
```

```sql
select table_schema, table_name
from information_schema.tables
where table_name ilike '%migration%'
order by table_schema, table_name;
```

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

```sql
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;
```

禁止:

- `insert / update / delete / create / alter / drop` を含む SQL。
- dashboard 上の RLS / policy 変更。
- SQL Editor からの更新。

## repo migration と remote schema の照合手順

照合の目的:

- repo migration が意図する schema と remote schema が一致しているか確認する。
- remote migration history が空でも、schema 自体が反映済みか判断する。
- `db push`、`migration repair`、個別 SQL 適用のどれが候補になるか整理する。

手順:

1. repo migration 一覧を時系列で読む。
2. 各 migration の対象 table / column / index / policy / trigger / function を表にする。
3. remote の table / column / constraint / RLS / policy / trigger / function を read-only で取得する。
4. repo migration の期待状態と remote 現状を照合する。
5. 一致、不一致、未確認、不要の分類を付ける。
6. 不一致がある場合、schema drift なのか migration history drift なのかを分ける。

照合表の例:

| migration | 対象 | repo expectation | remote observed | status | notes |
| --- | --- | --- | --- | --- | --- |
| `YYYYMMDDxxxx_name.sql` | `public.table.column` | exists | exists | match | |
| `YYYYMMDDxxxx_name.sql` | policy | `authenticated` only | unknown | unknown | read-only SQL needed |

status:

- `match`
- `drift`
- `history-only drift`
- `unknown`
- `not applicable`

## remote migration history が空 / 欠落している場合の切り分け

remote migration history が空または欠落している場合、次を切り分ける。

### 1. CLI が履歴を読めていないだけか

確認すること:

- linked project が正しいか。
- `npx supabase migration list` の remote 列。
- `supabase_migrations` schema の有無。
- migration 名を含む table の有無。

### 2. migration history table が存在しないか

確認すること:

- `supabase_migrations` schema。
- `supabase_migrations.schema_migrations` 相当の table。
- `auth.schema_migrations`、`realtime.schema_migrations`、`storage.migrations` との混同。

### 3. schema は反映済みだが履歴だけ欠落しているか

確認すること:

- 主要 table が存在するか。
- 主要 column が存在するか。
- RLS / policy / trigger / function が repo migration の期待と合うか。
- 後半 migration の成果物が remote に存在するか。

### 4. schema 自体も drift しているか

確認すること:

- repo expectation にある table / column / policy が remote にない。
- remote にだけ存在する schema がある。
- function 定義が異なる。
- RLS 状態が異なる。

切り分け結果:

- `history-only drift`
- `schema drift`
- `unknown`
- `wrong project suspected`
- `tooling / link issue suspected`

## `migration repair` 候補整理の条件

`migration repair` は remote migration history table への write を伴うため、Human approval gate が必要である。

候補にしてよい条件:

- repo migration と remote schema の一致度が十分に確認されている。
- remote migration history が空または欠落していることが read-only で確認されている。
- どの migration version を `applied` として登録すべきか表で整理できている。
- repair 後に `db push` をどう扱うか方針がある。
- rollback または復旧方針が書ける。

候補にしてはいけない条件:

- remote project が正しいか不明。
- remote schema と repo migration の一致度が低い。
- 未確認 migration が多い。
- repair 後の `db push` が過剰適用になる可能性を評価していない。
- Human approval request が未作成。

repair 候補表:

| version | migration file | remote schema evidence | proposed status | risk | notes |
| --- | --- | --- | --- | --- | --- |
| `YYYYMMDDxxxx` | `file.sql` | table / column / policy exists | applied | low / medium / high | |

## `db push` を使ってよい条件

`db push` は remote DB への write を伴うため、Human approval gate が必要である。

使ってよい候補になる条件:

- remote migration history が repo と整合している。
- `npx supabase migration list` で remote 適用状態が確認できる。
- 未適用として表示される migration が、今回適用したい migration に限定されている。
- schema drift が整理済み。
- `db push` が過剰適用にならないと説明できる。
- rollback plan がある。
- Human approval request がある。

## `db push` を使ってはいけない条件

次の場合は `db push` を使わない。

- remote migration history が空。
- remote migration history が欠落している。
- `db push` が local 全 migration を未適用として扱う可能性がある。
- repo migration と remote schema の一致度が不明。
- 対象 project が本番か開発用か不明。
- rollback plan がない。
- Human approval gate を通っていない。

Bloomlog の現時点の判断:

- remote migration history 空問題が解決するまで、`npx supabase db push` は標準手段にしない。

## 個別 SQL 適用を検討する条件

個別 SQL 適用も production DB write であるため、Human approval gate が必要である。

検討してよい条件:

- `db push` が remote migration history 空問題により過剰適用になる可能性がある。
- 変更対象が小さく、SQL が限定的である。
- repo 側に対象 SQL または migration 案を残せる。
- 実行 SQL、risk、rollback、verification を明確にできる。
- read-only introspection で適用前状態を確認済み。

検討してはいけない条件:

- destructive SQL を含むが rollback がない。
- 影響範囲が不明。
- 本番 DB 対象が不明。
- Human approval request がない。

## rollback plan の作り方

rollback plan は AI が作る。

含めること:

- 対象 environment。
- 対象 table / column / policy / trigger / function / migration history。
- 戻すための exact SQL または手順。
- rollback できない場合の理由。
- rollback に伴う data loss の有無。
- rollback 後の read-only verification。

rollback plan の分類:

- `simple SQL rollback`
- `forward fix`
- `restore from backup required`
- `not safely reversible`

rollback plan 例:

```text
rollback type:
target:
commands / SQL:
risk:
verification:
```

## Human approval gate に入る条件

次は必ず Human approval gate に入る。

- migration apply。
- migration repair。
- `db push`。
- destructive SQL。
- production DB write。
- dashboard 上の DB 設定変更。
- secret / token / environment variable 変更。

Human approval gate に入る前に AI が完了しているべきこと:

- read-only introspection。
- repo migration と remote schema の照合。
- risk 整理。
- rollback plan。
- exact command / SQL / setting の提示。
- verification plan。
- unknowns の列挙。
- approval-needed 案の作成。

## approval request に含める内容

approval request は `docs/ai-team/templates/approval-needed-template.md` を使う。

必須項目:

- approval id。
- mission id。
- approval type。
- requested action。
- exact command / SQL / setting。
- target environment。
- risk。
- rollback。
- verification。
- approval options。

approval type:

- migration apply
- migration repair
- db push
- destructive SQL
- dashboard
- production write
- secret

注意:

- secret / token は書かない。
- メール本文全文は保存しない。
- Human に SQL 組み立てや diff 確認を依頼しない。

## migration 履歴空問題を AI チーム Mission 化する手順

remote migration 履歴空問題は、単発調査ではなく Mission として扱う。

### Mission 作成

`docs/ai-team/templates/mission-template.md` を使い、次を定義する。

- mission id: `mission-YYYYMMDD-supabase-migration-history`
- path type: `DB / migration path`
- goal: remote migration history 空問題の切り分けと標準適用手段の判断材料作成。
- out of scope: DB write、migration repair、`db push`、destructive SQL。
- required agents: Parent Agent、DB Inspector Agent、Reviewer Agent、QA Agent、Sakura。
- approval gates: repair / db push / production write が候補になる場合のみ Human approval。

### Task 分解

`docs/ai-team/templates/task-template.md` を使い、最低限次の Task を作る。

- Parent: Mission 統合。
- DB Inspector: read-only introspection と照合表作成。
- Reviewer: docs-only / approval gate / risk review。
- QA: read-only command と Report の整合確認。
- Sakura: 方針レビューと人間意図の翻訳。

### Report 作成

`docs/ai-team/templates/report-template.md` を使い、DB Inspector Report に次を含める。

- migration history visibility。
- repo migration list。
- remote schema evidence。
- drift table。
- repair candidate table。
- `db push` 可否。
- 個別 SQL 適用候補。
- rollback plan。
- unknowns。
- approval required: yes / no。

### approval-needed 案

write が必要な候補が残る場合のみ作る。

対象:

- `migration repair`
- `db push`
- individual SQL
- dashboard setting

approval-needed には exact command / SQL / risk / rollback / verification を含める。

## Report に残すべき標準項目

DB / migration Report には次を必ず書く。

- mission id。
- task id。
- agent role: DB Inspector Agent。
- input files read。
- commands run。
- read-only SQL run。
- repo migrations observed。
- remote migration history observed。
- remote schema observed。
- drift summary。
- repair candidate table。
- `db push` judgment。
- individual SQL judgment。
- risks。
- rollback。
- unknowns。
- approval required。
- next action。

## 禁止事項

- `app/`、`lib/`、`package.json`、`.env*` をこの docs 作成のために変更しない。
- `supabase/migrations/` をこの docs 作成のために変更しない。
- DB write をしない。
- migration repair をしない。
- `db push` をしない。
- destructive SQL を実行しない。
- archive 移動をしない。
- ファイル削除をしない。
- secret を保存しない。
