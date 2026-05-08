# AI 運用ドキュメント棚卸し

作成日: 2026-05-09

## 目的

新しい AI 開発組織設計を入れる前に、`AGENTS.md` と `docs/ai-team/` 配下の現状を棚卸しする。

今回の作業では、既存 MD の大幅改修、削除、archive 移動、migration、DB write、`app/` / `lib/` / `supabase/` / `package.json` / `.env` の変更は行わない。

## 現在の未コミット差分

作業開始時点の `git status --short`:

```text
 M docs/ai-team/2026-05-08-rls-and-agent-ops-handoff.md
 M docs/ai-team/supabase-db-introspection.md
```

作業開始時点の `git diff --name-only`:

```text
docs/ai-team/2026-05-08-rls-and-agent-ops-handoff.md
docs/ai-team/supabase-db-introspection.md
```

作業開始時点の `git diff --stat`:

```text
 .../2026-05-08-rls-and-agent-ops-handoff.md |  17 +++
 docs/ai-team/supabase-db-introspection.md   | 152 +++++++++++++++++++--
 2 files changed, 156 insertions(+), 13 deletions(-)
```

差分の性質:

- どちらも `docs/ai-team/` 配下の docs-only 差分。
- `2026-05-08-rls-and-agent-ops-handoff.md` は remote migration 履歴空問題と read-only spot check の追記。
- `supabase-db-introspection.md` は `npx supabase` 前提、linked project、remote migration 履歴空問題、read-only 確認項目、`migration repair` は write なので別承認という整理の追記。

## 読んだファイル一覧

正式仕様・前提確認:

- `docs/product/overview.md`
- `docs/product/current-status.md`
- `docs/product/dev.md`

棚卸し対象:

- `AGENTS.md`
- `docs/ai-team/00-charter.md`
- `docs/ai-team/01-parent-brief.md`
- `docs/ai-team/99-integration-input.md`
- `docs/ai-team/2026-05-08-rls-and-agent-ops-handoff.md`
- `docs/ai-team/context.md`
- `docs/ai-team/handoff-2026-04-05.md`
- `docs/ai-team/notification-review-log.md`
- `docs/ai-team/notification-review-policy.md`
- `docs/ai-team/notification-review-prompt.md`
- `docs/ai-team/notification-review-status.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/supabase-rls-remediation-checklist.md`

## ファイル別棚卸し

| ファイル | 現在の役割 | 古い思想・問題記述 | 候補 | メモ |
| --- | --- | --- | --- | --- |
| `AGENTS.md` | repo 全体の AI 作業規約。人間は承認者、AI は作業者という新しめの方針も含む。 | 大きな問題は少ないが、`まず Plan only` が常時実装前ルールとして強く、通常実装時の進行との関係を整理したい。 | 改修 | 新設計の最上位ルールとして残しつつ、Plan only の適用条件、AI の自律調査範囲、承認ポイントを明文化する。 |
| `docs/ai-team/00-charter.md` | 初期の開発憲章。プロダクト定義、UX 原則、優先順位をまとめる。 | 現在の `docs/product/overview.md` と重複が多い。AI 行動ルールは汎用的で、現行の DB / 通知 / 承認設計を含まない。 | archive | 履歴価値はあるが、正式仕様としては `docs/product/` に寄せるべき。 |
| `docs/ai-team/01-parent-brief.md` | ホーム改善・導線整理に向けた親指示書。 | 特定時点の実装ブリーフで、現在の AI 運用設計とは直接関係が薄い。 | archive | 完了済みまたは過去スコープの作業指示として扱う。 |
| `docs/ai-team/99-integration-input.md` | 統合入力用と思われる空ファイル。 | 内容がなく、役割が不明。 | 削除候補 | 削除は今回しない。新設計で使うなら用途を定義し直す。 |
| `docs/ai-team/context.md` | Codex 作業開始時の入口。UI 用語、写真機能、実験ルールなどをまとめる。 | 「必ず参照」「いきなり実装しない」「不明点は仮定せず確認」が強く、人間確認前提に寄りやすい。内容の一部は product docs と重複・古い可能性がある。 | 改修 | 入口 docs としては有用。正式仕様は `docs/product/`、AI 作業ルールは `AGENTS.md` / 新設計 MD へ分離したい。 |
| `docs/ai-team/handoff-2026-04-05.md` | 2026-04-05 時点の認証・プロフィール実装引き継ぎ。 | 「人間確認係化」は強くないが、状態が時点依存。現在仕様と差分が出やすい。 | archive | 認証の履歴資料として残す。現行作業入口にはしない。 |
| `docs/ai-team/notification-review-policy.md` | 外部通知レビューの基本方針。取得・分析・承認の分離、本文保存禁止など。 | 人間承認前に実装しない方針は妥当。ただし「最終判断は人間」が広く見え、AI が可能な read-only 調査まで戻す解釈を避けたい。 | 改修 | 通知レビューの 3 層分離は残す。AI が取得・分析・差分整理を担う範囲を補強する。 |
| `docs/ai-team/notification-review-prompt.md` | 外部通知分析用の定型プロンプト。 | Gmail 本文を貼る、出力結果を転記する、という人間コピペ・転記前提が強い。 | 改修 | 連携可能な場合は AI が検索・要約・記録案作成まで行う設計へ更新したい。 |
| `docs/ai-team/notification-review-status.md` | 通知レビュー状態の一覧管理テンプレート。 | 手動表更新を前提にしており、運用が人間転記に寄りやすい。 | 改修 | 状態管理自体は残す。AI が更新候補を作り、人間は承認する形へ寄せる。 |
| `docs/ai-team/notification-review-log.md` | 通知レビュー結果の記録テンプレート。 | 本文保存禁止は妥当。テンプレート複製・転記前提が残る。 | 改修 | AI が要約と判断だけを記録する運用に合わせる。 |
| `docs/ai-team/supabase-db-introspection.md` | Supabase 実 DB の read-only introspection 手順。remote migration 履歴問題の整理。 | 旧差分には「人間が CLI 前提を整える」が残っていたが、未コミット差分で `npx supabase` と AI read-only 調査へ寄せられている。 | 残す | 新設計の DB 調査原則に近い。承認境界と write 禁止を維持して参照手順として残す。 |
| `docs/ai-team/supabase-rls-remediation-checklist.md` | RLS 修正の確認チェックリストと実施結果。 | 「人間が確認する項目」「手動テスト観点」があり、人間確認係化に見える箇所がある。一方で SQL 確認手順は有用。 | 改修 | AI が read-only SQL と検証観点を主導し、本番 write 承認だけ人間に残す形へ整理する。 |
| `docs/ai-team/2026-05-08-rls-and-agent-ops-handoff.md` | RLS 対応と AI Agent 運用課題の handoff。 | 新方針に近いが、時点依存の handoff。恒久ルールと作業記録が混在している。 | 残す | 履歴資料として残し、恒久ルールは新設計 MD へ抽出する。 |
| `docs/ai-team/agent-ops-inventory.md` | 今回作成した棚卸し資料。 | なし。 | 残す | 新設計適用前の整理材料。 |

## 問題記述の分類

### 古い思想が強いもの

- `docs/ai-team/00-charter.md`
- `docs/ai-team/01-parent-brief.md`
- `docs/ai-team/context.md`

理由:

- 現在の正式仕様や運用原則より前の作業入口・指示書として見える。
- 現行の通知レビュー、DB read-only introspection、承認境界が十分に反映されていない。

### 人間コピペ・転記前提が強いもの

- `docs/ai-team/notification-review-prompt.md`
- `docs/ai-team/notification-review-status.md`
- `docs/ai-team/notification-review-log.md`

理由:

- Gmail 本文の貼り付け、結果の転記、表の手動更新を人間が行う運用に寄っている。
- 新設計では AI が取得可能な範囲の検索・要約・記録案作成まで担い、人間は承認に集中する形へ寄せるべき。

### 人間確認係化している可能性があるもの

- `docs/ai-team/supabase-rls-remediation-checklist.md`
- `docs/ai-team/notification-review-policy.md`
- `docs/ai-team/context.md`

理由:

- 「人間が確認する」「最終判断は人間」「不明点は確認」が広く読める。
- 本番 write、destructive SQL、secret、dashboard 変更の承認は人間に残しつつ、read-only 調査、差分整理、検証観点整理は AI の責務として再定義したい。

### 現行方針に近いもの

- `AGENTS.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/2026-05-08-rls-and-agent-ops-handoff.md`

理由:

- 人間を確認係にしない、AI が read-only introspection を担う、本番 write 直前で止まる、という方針が明記されている。
- ただし恒久ルール、手順、時点依存 handoff が混在しているため、設計 MD へ役割分離した方がよい。

## 残す / 改修 / archive / 削除候補

### 残す

- `AGENTS.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/2026-05-08-rls-and-agent-ops-handoff.md`
- `docs/ai-team/agent-ops-inventory.md`

### 改修

- `docs/ai-team/context.md`
- `docs/ai-team/notification-review-policy.md`
- `docs/ai-team/notification-review-prompt.md`
- `docs/ai-team/notification-review-status.md`
- `docs/ai-team/notification-review-log.md`
- `docs/ai-team/supabase-rls-remediation-checklist.md`

### archive 候補

- `docs/ai-team/00-charter.md`
- `docs/ai-team/01-parent-brief.md`
- `docs/ai-team/handoff-2026-04-05.md`

### 削除候補

- `docs/ai-team/99-integration-input.md`

削除候補の理由:

- 空ファイルで現時点の役割が確認できないため。
- ただし今回の作業では削除しない。

## 新しい AI 開発組織設計に向けた移行方針

1. 恒久ルール、時点依存 handoff、作業テンプレートを分離する。
2. `AGENTS.md` は repo 全体の最上位行動規約として残し、承認境界を明確化する。
3. `docs/product/` は正式仕様、`docs/ai-team/` は AI 運用・分析・handoff・承認前判断材料に限定する。
4. AI が行うべき read-only 調査、差分整理、lint、build、検証観点整理を明文化する。
5. 人間が担う範囲は、本番 DB write、destructive SQL、secret 変更、dashboard 設定変更の承認に限定する。
6. 通知レビューは「取得 / 分析 / 承認」を維持しつつ、取得と分析を人間コピペ前提から AI 主導へ寄せる。
7. DB 運用は `supabase-db-introspection.md` を土台に、`db push` / `migration repair` / 個別 SQL 適用の承認手順を別設計に切り出す。
8. 過去ブリーフや handoff は archive へ寄せ、現行作業入口から外す。

## 次に作るべき設計 MD 一覧

- `docs/ai-team/agent-operating-model.md`
  - AI と人間の役割、承認境界、AI が自律実行すべき read-only 作業を定義する。

- `docs/ai-team/agent-docs-map.md`
  - `docs/product/`、`docs/ai-team/`、`PLANS.md`、`tech-debt`、handoff、archive の置き場所と寿命を定義する。

- `docs/ai-team/agent-review-workflow.md`
  - 通知レビュー、コードレビュー、DB 調査、実装依頼をどう分離し、どこで承認するかを定義する。

- `docs/ai-team/supabase-migration-ops.md`
  - remote migration 履歴空問題、`migration repair`、`db push`、個別 SQL 適用の判断基準と承認手順を定義する。

- `docs/ai-team/agent-handoff-template.md`
  - 時点依存の引き継ぎを残すテンプレート。恒久ルールと混ぜないために使う。

- `docs/ai-team/notification-review-workflow.md`
  - 取得、分析、承認、記録の実運用を、AI 主導かつ本文全文保存なしで定義する。

## 今回変えていないこと

- 既存 MD の大幅改修はしていない。
- ファイル削除はしていない。
- archive 移動はしていない。
- `app/`、`lib/`、`supabase/`、`migrations/`、`package.json`、`.env` は変更していない。
- DB write、migration repair、`db push` は実行していない。
