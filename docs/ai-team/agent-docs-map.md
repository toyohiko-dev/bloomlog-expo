# Bloomlog Agent Docs Map

作成日: 2026-05-09

## 目的

このドキュメントは、Bloomlog の docs 配置、寿命、更新責任、archive 条件を定義する。

AI Team / Agent OS 作業の入口は `AGENTS.md` である。Mission state の正本は `docs/ai-team/mission-lifecycle.md` である。この docs map は、入口ではなく docs 配置と寿命を補助する supporting reference である。

## 基本方針

- `docs/product/` は正式仕様・プロダクト判断の置き場である。
- `docs/ai-team/` は AI 運用、調査、handoff、decision log、承認前判断材料の置き場である。
- `docs/archive/` は退役資料の置き場である。
- チャットは作業中の補助に留め、最終状態は docs、branch、PR、issue に残す。
- docs は増やす前に、既存 docs の責務で扱えるか確認する。
- 新規 docs 作成より既存 docs / mission / decision log / report への追記を優先する。
- Mission artifacts は恒久ルールではない。恒久ルールは `AGENTS.md`、`docs/ai-team/mission-lifecycle.md`、必要最小限の運用 docs に集約する。
- Bloomlog 固定用語である「来場日」「思い出」「思い出アルバム」「タイムライン」「記録」は変更しない。

## 配置ルール

### `docs/product/`

正式仕様・プロダクト判断の置き場。

置くもの:

- 確定したプロダクト仕様。
- Bloomlog の体験価値、用語、ドメイン構造。
- 現在採用されている開発方針。
- 確定済みの技術方針。
- UI やデータ構造に影響する正式判断。

置かないもの:

- 承認前の調査メモ。
- 外部通知レビューの途中経過。
- 一時的な handoff。
- Agent の作業ログ。
- 未確定の migration 方針。

更新責任:

- Parent Agent が更新要否を判断する。
- Writer Agent が変更案を作る。
- Sakura が方針レビューを行う。
- Human が必要に応じて最終判断する。

### `docs/ai-team/`

AI 運用、調査、handoff、decision log、承認前判断材料の置き場。

置くもの:

- AI Agent の恒久運用ルール。
- Agent 間の作業分担、Mission、Task、Report。
- read-only introspection の手順と結果。
- DB / RLS / policy / trigger / function / migration 差分調査。
- 外部通知レビューの要約と判断材料。
- 承認 gate 前の影響範囲、リスク、rollback 案。
- handoff。
- decision log。

置かないもの:

- 確定済みのプロダクト仕様の唯一の正本。
- secret、token、API key、OAuth secret。
- メール本文全文。
- 本番 DB write の実行結果だけに依存した未整理メモ。

更新責任:

- Parent Agent が構成と寿命を管理する。
- Writer Agent が docs を作成・更新する。
- Reviewer Agent が重複、古さ、責務違反を確認する。
- DB Inspector Agent が DB 関連の read-only 調査 docs を更新する。
- QA Agent が検証結果と残リスクを Report に反映する。

### `docs/archive/`

退役資料の置き場。

置くもの:

- 古い handoff。
- 完了済み checklist。
- 現行ルールに統合済みの旧運用 MD。
- 過去の一時ブリーフ。
- 参照頻度が下がったが履歴として残す価値がある資料。

置かないもの:

- 現在の正式仕様。
- 現在の operating model。
- 進行中の調査。
- 承認待ちの判断材料。

更新責任:

- Parent Agent が archive 候補を提案する。
- Reviewer Agent が現行 docs から参照が残っていないか確認する。
- Human または Sakura が必要に応じて archive 方針を承認する。

## docs の寿命定義

| 種類 | 寿命 | 置き場所 | 更新方針 | archive 条件 |
| --- | --- | --- | --- | --- |
| operating model | 恒久 | `docs/ai-team/` | 方針変更時だけ更新 | 新 model に置き換わり、参照先が更新されたとき |
| docs map | 恒久 | `docs/ai-team/` | docs 構造変更時だけ更新 | 新 docs map に置き換わったとき |
| mission lifecycle | 恒久 | `docs/ai-team/` | Mission 状態管理ルール変更時だけ更新 | 新 lifecycle model に置き換わり、参照先が更新されたとき |
| product spec | 恒久 | `docs/product/` | 確定仕様が変わったとき更新 | 原則 archive しない。分割や統合時のみ |
| decision log | 中長期 | `docs/ai-team/` | 重要判断ごとに追記 | 判断が product docs に反映済みで、履歴参照だけになったとき |
| introspection log | 更新型 | `docs/ai-team/` | read-only 調査のたびに更新 | 対象課題が解決し、後続手順に統合済みのとき |
| handoff | 短命 | `docs/ai-team/` | 作業終了時または中断時に作成 | 後続 Agent が引き継ぎ完了したとき |
| checklist | 短命から中期 | `docs/ai-team/` | 対応中に更新 | 完了後、Report または decision log に反映済みのとき |
| notification review | 短命から中期 | `docs/ai-team/` | 通知レビューごとに更新 | 対応不要、対応済み、または正式タスク化されたとき |
| PR report | 短命 | PR または `docs/ai-team/` | PR ごとに作成 | PR merge 後、必要情報が docs に反映済みのとき |

## 作業開始時の入口

すべての作業で最初に読む入口は `AGENTS.md` とする。

追加で読む docs は、作業対象に直接関係するものだけに限定する。

- Mission state を更新する場合: `docs/ai-team/mission-lifecycle.md`。
- docs 配置や archive 判断を行う場合: `docs/ai-team/agent-docs-map.md`。
- product 仕様に触れる場合: 関連する `docs/product/`。
- DB / Supabase 作業の場合: 関連する mission、report、`docs/ai-team/supabase-db-introspection.md`、対象 migration。
- Next.js 変更時: `node_modules/next/dist/docs/` の関連 guide。

「すべての作業で多数の docs を読む」ことを標準にしない。必要な docs を絞り、既存 Mission が `completed` / `superseded` の場合は再開しない。

## PR 前に更新すべき docs

PR 前には、次を確認する。

- 正式仕様が変わった場合は `docs/product/` を更新する。
- AI 運用、調査、handoff、承認前判断材料が増えた場合は `docs/ai-team/` を更新する。
- 重要判断があった場合は decision log を更新する。
- DB / RLS / migration 調査をした場合は introspection log または関連調査 docs を更新する。
- 未解決の引き継ぎが残る場合は handoff を作る。
- 完了した checklist がある場合は、完了状態を反映し、archive 候補にする。
- docs を更新しない場合は、PR description または Report に「docs 更新不要」の理由を書く。

PR 前に確認する diff:

```powershell
git diff --name-only
git diff --stat
```

確認観点:

- `docs/product/` と `docs/ai-team/` の責務が混ざっていないか。
- 確定事項と承認前判断材料が混ざっていないか。
- handoff に恒久ルールを書いていないか。
- secret やメール本文全文を保存していないか。
- Bloomlog 固定用語を変えていないか。

## docs 乱立を防ぐルール

新規 docs を作る前に、次を確認する。

1. 既存 docs に追記できないか。
2. 恒久ルール、調査ログ、handoff、decision log、checklist のどれに該当するか。
3. 寿命が短い内容を恒久 docs として作ろうとしていないか。
4. 似た名前や似た責務の docs が既にないか。
5. 作成後に誰が更新し、いつ archive するか説明できるか。

新規 docs を作ってよい条件:

- 既存 docs に追記すると責務が混ざる。
- 今後も参照される明確な運用単位がある。
- Mission / Task / Report / Decision Log のどれに当たるか説明できる。
- archive 条件を定義できる。
- Parent Agent が、既存 docs 更新では足りない理由を Report または decision log に残せる。

新規 docs を作らない条件:

- 1回限りのメモで、PR description に書けば足りる。
- 既存 handoff に追記すれば足りる。
- 未確定アイデアで、`PLANS.md` または issue が適切。
- 正式仕様ではないのに `docs/product/` に置こうとしている。

## handoff の archive 条件

handoff は短命であり、現行作業入口に残し続けない。

archive 候補になる条件:

- 後続 Agent が内容を読み、必要な Task を完了した。
- handoff の判断が decision log または product docs に反映された。
- handoff の未解決事項が issue、PR、別 docs に移された。
- 同じ内容を新しい handoff が置き換えた。
- 作成から時間が経ち、現行状態と差分が大きい。

archive 前に確認すること:

- 未解決の承認 gate が残っていないか。
- 本番 DB、secret、dashboard に関する未対応事項が残っていないか。
- 現行 docs から参照されていないか。
- 必要な履歴が decision log に残っているか。

archive するときの扱い:

- `docs/archive/` に移す。
- ファイル名に日付または元の文脈を残す。
- 移動だけで内容を大幅改修しない。
- archive 移動自体も diff として PR または Report に明記する。

## checklist の archive 条件

checklist は対応中の作業管理に使う。完了後は現行入口から外す。

archive 候補になる条件:

- 全項目が完了した。
- 未完了項目が issue、Task、handoff に切り出された。
- 結果が Report または decision log に反映された。
- 再利用する場合でも、テンプレートとして別 docs に分離済みである。

## introspection log の更新ルール

introspection log は更新型である。

更新するタイミング:

- read-only DB 調査を行ったとき。
- RLS、policy、trigger、function、migration 履歴の差分を確認したとき。
- remote と repo の schema 差分が変わったとき。
- `db push`、`migration repair`、個別 SQL 適用の判断材料を追加したとき。

書くべき内容:

- 調査日。
- 対象。
- 実行した read-only コマンドまたは SQL。
- 確認できたこと。
- 未確認のこと。
- write が必要な場合の approval gate。
- rollback 案または rollback 案が未作成である理由。

書かないこと:

- secret。
- 本文全文の通知メール。
- 本番 write の実行を促す未承認手順。

## decision log の更新ルール

decision log は中長期で残す。

更新するタイミング:

- Human が本番操作を承認または却下した。
- Sakura が方針レビューで重要な方向修正を示した。
- 仕様、用語、DB 運用、通知レビュー運用に関する判断が固まった。
- 複数案からひとつを選んだ。

書くべき内容:

- 決定日。
- 決定者。
- 決定内容。
- 選ばなかった案。
- 根拠。
- 影響範囲。
- 後で見直す条件。

## operating model の更新ルール

`docs/ai-team/agent-operating-model.md` は恒久ルールであり、頻繁に変更しない。

更新してよい場合:

- Human / Sakura / Agent の役割定義が変わる。
- 承認 gate の範囲が変わる。
- Agent 間通信の標準が変わる。
- docs-only safe path、code branch + PR path、DB approval gate、secret / dashboard approval gate の方針が変わる。

更新しない場合:

- 一時的な作業メモ。
- 単発 Mission の判断。
- 個別 PR の検証結果。
- 完了済み checklist。

## 現行 docs の分類

| ファイル | 種類 | 寿命 | 扱い |
| --- | --- | --- | --- |
| `AGENTS.md` | entrypoint | 恒久 | AI Team / Agent OS 作業の唯一の入口 |
| `docs/ai-team/mission-lifecycle.md` | mission lifecycle | 恒久 | Mission state 管理の正本 |
| `docs/ai-team/agent-operating-model.md` | operating model | 恒久 | 役割と承認境界の参照 docs |
| `docs/ai-team/agent-review-workflow.md` | review workflow | 恒久 | review / approval flow の参照 docs |
| `docs/ai-team/agent-communication-protocol.md` | communication protocol | 恒久 | Agent 間通信の参照 docs |
| `docs/ai-team/templates/` | templates | 恒久 | Mission artifacts の作成テンプレート |
| `docs/ai-team/agent-docs-map.md` | docs map | 参照 | docs 配置と寿命の supporting reference |
| `docs/ai-team/agent-ops-inventory.md` | inventory | 履歴 | 棚卸し完了済み。現行入口ではない |
| `docs/ai-team/supabase-migration-ops.md` | DB reference | 参照 | DB / migration 作業時のみ読む supporting reference |
| `docs/ai-team/supabase-db-introspection.md` | introspection log / 手順 | 更新型 | DB 調査時の参照 docs |
| `docs/ai-team/supabase-rls-remediation-checklist.md` | checklist | 短命から中期 | 完了状態整理後に archive 候補 |
| `docs/ai-team/context.md` | 旧入口 docs | 中期 | operating model と product docs へ整理後に改修または archive 候補 |
| `docs/ai-team/notification-review-*.md` | notification review | 短命から中期 | 新 workflow 作成後に改修または archive 候補 |
| `docs/archive/00-charter.md` | 旧憲章 | 履歴 | archived |
| `docs/archive/01-parent-brief.md` | 旧作業ブリーフ | 履歴 | archived |
| `docs/archive/handoff-2026-04-05.md` | handoff | 履歴 | archived |
| `docs/archive/2026-05-08-rls-and-agent-ops-handoff.md` | handoff | 履歴 | archived |
| `docs/ai-team/99-integration-input.md` | 空ファイル | 退役 | deleted |

## 禁止事項

- `app/`、`lib/`、`supabase/`、`package.json`、`migrations/` をこの docs map 作成のために変更しない。
- DB 操作をしない。
- migration を追加しない。
- `db push` をしない。
- `migration repair` をしない。
- secret や `.env` を変更しない。
- Bloomlog 固定用語を変更しない。
- docs の archive 移動や削除は、この docs map 作成とは別 Task として扱う。
