# Approval Needed

## approval id

`approval-20260509-supabase-migration-history`

## mission id

`mission-20260509-supabase-migration-history`

## approval type

- migration repair
- db push
- production write
- destructive SQL

## requested action

現時点では未承認の実行要求はない。

このファイルは、DB Inspector Agent の read-only 調査後に write 候補が残る場合の approval gate 入口として使う。Human には SQL 組み立てや diff 確認を依頼しない。Agent が exact command / SQL / risk / rollback / verification を整理してから approval gate に入る。

## exact command / SQL / setting

secret / token は書かない。メール本文全文も保存しない。

```text
pending read-only investigation
```

候補になりうる操作:

- `npx supabase migration repair --status applied <version>`
- `npx supabase db push`
- individual SQL for production DB

上記は候補であり、Human approval 前に実行しない。

## target environment

- local / preview / production: production suspected, exact target to be confirmed by DB Inspector Agent
- service: Supabase
- project / app: Bloomlog Supabase project, project ref to be confirmed from existing linked state without storing secrets

## risk

- remote project が誤っている場合、本番以外または別 project に対する判断になる。
- migration history が空のまま `db push` すると、repo 側の全 migration が未適用として扱われる可能性がある。
- schema drift がある状態で `migration repair` すると、履歴だけを正しく見せて実 schema の不一致を隠す可能性がある。
- 個別 SQL は production DB write であり、対象 SQL の影響範囲と rollback が必要。

## rollback

- rollback possible: pending
- rollback plan: DB Inspector Agent が read-only 調査後に、候補操作ごとに `simple SQL rollback` / `forward fix` / `restore from backup required` / `not safely reversible` のいずれかで整理する。
- rollback risk: pending read-only investigation

## verification

- `npx supabase migration list` の remote 表示。
- `supabase_migrations` schema / migration table の有無。
- public schema の table / column / constraint / RLS / policy / trigger / function の read-only 再確認。
- repo migration と remote schema の照合表更新。
- repair 後または write 後に `db push` を標準手段へ戻せるかの再判定。

## approval options

Human は次のいずれかを選ぶ。

- approve
- reject
- request changes

## approval result

- selected option: pending
- decided by: pending
- decided at: pending
- notes: pending
