# Decision Log

## decision date

2026-05-09

## decision maker

- Parent Agent

## mission id

`mission-20260509-supabase-migration-history`

## decision

remote migration 履歴空問題は、DB / migration path の Mission として扱う。今回の初期作成では docs-only safe path に限定し、Mission / Task / approval-needed 案だけを作成する。DB write、migration repair、`db push`、destructive SQL、`supabase/migrations/` 変更は実行しない。

## alternatives considered

- すぐに `npx supabase db push` を実行する。
- すぐに `npx supabase migration repair` を実行する。
- チャットだけで DB Inspector への指示を渡す。
- Human または Sakura に Agent 間の調査結果転記を依頼する。

## rationale

- remote migration history が空または欠落している状態では、`db push` が全 migration を未適用として扱う可能性がある。
- `migration repair` は remote migration history table への write を伴うため、Human approval gate が必要である。
- Agent 間通信は repo files / branch / PR / issue を正とし、Human や Sakura を通信路にしない。
- docs-only safe path は Reviewer Agent の条件確認後に auto commit / push してよい。

## impact

- affected docs: `docs/ai-team/missions/mission-20260509-supabase-migration-history/`
- affected code: none
- affected DB / migration: none in this setup step
- affected secret / dashboard: none
- affected operations: DB Inspector Agent の次回 read-only 棚卸し入口が作成される

## follow-up

- DB Inspector Agent が `tasks/db-inspector.md` を読み、read-only 調査結果を `reports/db-inspector-report.md` に書く。
- Reviewer Agent が docs-only safe path と approval gate を review する。
- QA Agent が validation 設計と report 整合性を確認する。
- Parent Agent が report を統合し、必要に応じて `approval-needed.md` を具体化する。

## revisit condition

- remote migration history の実態が read-only で確認されたとき。
- repo migration と remote schema に schema drift が見つかったとき。
- `migration repair`、`db push`、個別 SQL 適用のいずれかを Human approval gate に進めるとき。

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human を Agent 間通信路にしない。
- Sakura を Agent 間通信路にしない。

---

## decision date

2026-05-09

## decision maker

- Parent Agent

## mission id

`mission-20260509-supabase-migration-history`

## decision

更新済みの Reviewer / QA reports を含めて再統合した。結論は変更しない。Mission result は docs-only safe path のままであり、read-only 棚卸しは完了扱いにできるが、remediation 実行には進まない。

`approval-needed.md` は引き続き pending gate とし、Human approval を求める executable request にはしない。

## alternatives considered

- QA rerun / Reviewer rerun を受けて `approval-needed.md` を executable approval request に変える。
- docs-only reintegration ではなく DB Inspector follow-up を待って Parent summary を更新しない。
- `db push` または `migration repair` の approval gate に進める。

## rationale

- Reviewer rerun は docs-only safe path と pending approval gate を確認している。
- QA rerun は full report set と Parent summary を含めて整合性を確認している。
- どの report も `migration history drift + partial schema drift` の分類を維持している。
- exact command / SQL、target environment、operation-specific rollback、verification がまだ揃っていない。
- write 操作を承認依頼するには、remediation candidate の追加絞り込みが必要である。

## impact

- affected docs:
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/parent-summary.md`
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md`
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
- affected code: none
- affected DB / migration: none
- affected secret / dashboard: none
- affected operations:
  - production execution remains blocked.
  - next action remains DB Inspector follow-up for drift narrowing.

## follow-up

- DB Inspector Agent が drift causes と remediation candidates を絞る。
- `approval-needed.md` は候補が 1 つに絞られ、exact command / SQL / rollback / verification が揃うまで pending のままにする。
- commit / push する場合は final docs-only safe path check を行う。

## revisit condition

- DB Inspector follow-up report が追加されたとき。
- exact remediation candidate が 1 つに絞られたとき。
- Human approval gate に進めるための exact command / SQL / rollback / verification が揃ったとき。

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human を Agent 間通信路にしない。
- Sakura を Agent 間通信路にしない。

---

## decision date

2026-05-09

## decision maker

- Parent Agent

## mission id

`mission-20260509-supabase-migration-history`

## decision

DB Inspector / Reviewer / QA reports を統合し、現時点の分類を `migration history drift + partial schema drift` とする。read-only 棚卸しは完了扱いにできるが、`db push`、`migration repair`、個別 production SQL の実行には進まない。

`approval-needed.md` は executable approval request ではなく pending gate として残す。次は drift の追加調査と remediation 候補の絞り込みを行う。

## alternatives considered

- remote migration history が空であることだけを理由に、全 repo migration を `applied` として repair 候補にする。
- schema の主要部分が概ね存在することを理由に、`db push` を Human approval gate に進める。
- 欠落 function / trigger / index / storage policy を個別 SQL としてすぐ approval request にする。
- `approval-needed.md` に pending ではなく実行コマンドを確定で書く。

## rationale

- remote DB に `supabase_migrations` schema が見えず、`npx.cmd supabase migration list` の remote 列は空だった。
- 一方で remote schema は repo migration の主要成果物を多く含むため、全 schema が未適用とは言えない。
- `public.assign_visit_session_user_id`、`public.sync_activity_log_user_id`、対応 trigger、user_id 系 index、storage insert policy に drift がある。
- remote-only schema (`events`、`areas`、`countries`、`spots`、`pavilions.image_path`) の由来が未確認である。
- `db push` は全 migration 再適用や既存 schema / policy との衝突リスクが高い。
- `migration repair` は schema drift を履歴上の整合に見せてしまうリスクがある。

## impact

- affected docs:
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/parent-summary.md`
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md`
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
- affected code: none
- affected DB / migration: none
- affected secret / dashboard: none
- affected operations:
  - `db push` は引き続き標準手段にしない。
  - `migration repair` は現時点で実行候補にしない。
  - 次の DB Inspector task は drift 追加調査と候補絞り込みを行う。

## follow-up

- linked project の最終確認方法を secret なしで整理する。
- missing function / trigger / index が意図的な削除か drift かを app code と read-only evidence で確認する。
- storage insert policy `activity_photos_insert_test` の意図を確認する。
- `activity_logs_acquisition_method_check` の definition comparison を行う。
- repair 可能な migration と repair してはいけない migration を再分類する。
- approval request は候補を 1 つに絞れるまで pending のままにする。

## revisit condition

- linked project が確定したとき。
- missing function / trigger / index / storage policy drift の意図が確認できたとき。
- remote-only schema の扱いが決まったとき。
- `migration repair`、`db push`、個別 SQL のいずれかについて exact command / SQL / rollback / verification が揃ったとき。

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human を Agent 間通信路にしない。
- Sakura を Agent 間通信路にしない。
