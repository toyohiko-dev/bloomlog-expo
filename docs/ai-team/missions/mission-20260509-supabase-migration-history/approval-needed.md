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

現時点では未承認の実行要求はない。Parent 統合後も、このファイルは pending gate であり、executable approval request ではない。

DB Inspector / Reviewer / QA reports の統合により、問題は `history-only drift` ではなく `migration history drift + partial schema drift` と判断した。そのため、今すぐ `migration repair`、`db push`、個別 production SQL の approval は求めない。

このファイルは、write 候補が 1 つに絞られ、exact command / SQL / risk / rollback / verification が揃った時点で approval gate 入口として更新する。Human には SQL 組み立てや diff 確認を依頼しない。

## exact command / SQL / setting

secret / token は書かない。メール本文全文も保存しない。

```text
pending remediation candidate narrowing
```

候補になりうる操作:

- `npx supabase migration repair --status applied <version>`:
  - not ready
  - reason: schema drift が残っており、全 migration を applied 登録する根拠が不足している。
- `npx supabase db push`:
  - not allowed now
  - reason: remote migration history が空表示で、partial schema drift があるため全 migration 再適用 / 衝突リスクが高い。
- individual SQL for production DB:
  - not ready
  - reason: 欠落 function / trigger / index / storage policy の意図確認と operation-specific rollback が未完了。

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
- remote schema には missing function / trigger / index、storage policy drift、remote-only schema が混在している。
- `activity_photos_insert_test` の意図が未確認のまま policy を変更すると、現行アップロード動作を壊す可能性がある。
- missing user_id sync function / trigger が意図的削除だった場合、repo migration どおり戻すと現行 app の責務分担と衝突する可能性がある。

## rollback

- rollback possible: pending
- rollback plan:
  - `migration repair`: 誤 repair 時は version を `reverted` として repair する案が必要。ただし実行前に Supabase CLI current behavior を再確認する。
  - missing functions / triggers: `drop trigger if exists ...` / `drop function if exists ...` の rollback SQL を用意する。
  - missing indexes: `drop index if exists ...` を用意する。concurrent / lock 方針は事前確認する。
  - storage policy: 既存 policy 定義を保存し、policy gap が出ない順序で rollback SQL を用意する。
  - `db push`: not safely reversible。今は候補にしない。
- rollback risk: operation-specific rollback が未完成のため、まだ approval request にできない。

## verification

- `npx supabase migration list` の remote 表示。
- `supabase_migrations` schema / migration table の有無。
- public schema の table / column / constraint / RLS / policy / trigger / function の read-only 再確認。
- repo migration と remote schema の照合表更新。
- repair 後または write 後に `db push` を標準手段へ戻せるかの再判定。
- missing function / trigger / index の有無の read-only 再確認。
- storage insert policy definition の read-only 再確認。
- `activity_logs_acquisition_method_check` definition comparison。
- linked project が対象 Bloomlog project であることの secret なしの確認。

## approval options

Human は次のいずれかを選ぶ。

- approve
- reject
- request changes

## approval result

- selected option: pending
- decided by: pending
- decided at: pending
- notes: Parent integration keeps this approval pending. Do not execute `migration repair`, `db push`, production SQL, destructive SQL, dashboard changes, or secret changes from this file.
