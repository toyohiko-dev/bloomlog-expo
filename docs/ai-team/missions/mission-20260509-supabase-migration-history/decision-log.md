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
