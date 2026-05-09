<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bloomlog AGENTS

## 1. 基本原則

- Bloomlog はイベント体験記録アプリである
- 日本語 UI を前提とする
- `docs/product/` を正式仕様として扱う
- `docs/ai-team/` は AI 運用、検討、レビュー、分析、引き継ぎのための作業領域として扱う
- 実装より先に、既存の仕様、用語、運用方針との整合性を確認する

## 1.1. AI Team / Agent OS 作業の唯一の入口

- AI Team / Agent OS 作業では、まずこの `AGENTS.md` を読む。
- Mission state は `docs/ai-team/mission-lifecycle.md` に従う。
- 新規 MD を作る前に、既存 mission / docs / decision log / report に追記できないか確認する。
- `completed` / `superseded` の Mission は再開しない。必要な場合は、新しい Mission または follow-up task として切り出す。
- Parent Agent は docs-only safe path の条件を満たす場合、差分確認後に commit / push まで行う。
- Human は approval / rejection のみを行う。Human を mission state 更新係、転記係、diff 確認係にしない。
- 状態管理の正本は `docs/ai-team/mission-lifecycle.md`、docs 配置の supporting reference は `docs/ai-team/agent-docs-map.md` である。

## 2. AI と人間の役割

- AI は作業者であり、人間は承認者である
- 人間をスクリーンショット係、目視確認係、手作業の転記係にしない
- read-only introspection は AI が積極的に行う
- DB / RLS / policy / trigger / function / migration 差分調査は AI の責務とする
- migration 生成、lint、build、テスト設計、差分整理は AI が行う
- 人間承認が必要なのは、本番 DB write、destructive SQL、secret 変更、dashboard 設定変更のみとする
- 「安全のため」という理由だけで、AI が可能な調査作業を人間へ戻さない
- 本番 write 直前で停止し、人間承認後に AI が実行できる構成を目指す

## 3. 用語固定

以下の用語は勝手に変更しない。

- 来場日
- 思い出
- 思い出アルバム
- タイムライン
- 記録

次の行為は禁止する。

- 上記用語の英語化
- 既存日本語用語の独自言い換え
- UI 文言の無断変更

## 4. 実装前ルール

実装前は、次を最優先とする。

1. まず docs を読む
   - `docs/product/` を先に確認する
   - 必要に応じて `docs/ai-team/` も確認する
2. まず Plan only で整理する
3. 実装前にスコープを確認する
4. 最小変更を優先する
5. 既存構造を壊さない

追加原則:

- 既存ファイルの責務を優先する
- 既存の画面構成、ルーティング、用語、データ構造に合わせる
- 新規ファイルや新規構造の追加は、明確な必要性があるときだけ行う
- root cause に対処する

## 5. 禁止事項

明示依頼なしに、次の行為を行わない。

- migration を作らない
- webhook を作らない
- cron を作らない
- Gmail API を追加しない
- Apps Script を追加しない
- `service_role` / admin client を追加しない
- ops dashboard を作らない
- notification inbox を作らない
- app router を勝手に増やさない
- route / page / component を大量追加しない
- `package.json` を不要変更しない

加えて、次も禁止する。

- 実装相談なしに外部通知処理を Bloomlog 本体へ統合すること
- メール本文やセキュリティ通知を DB に保存すること
- 実運用に影響する大規模構造変更を未承認で進めること

## 6. 通知レビュー運用

Supabase / Vercel / GitHub などの外部通知は、次の 3 層を分離して扱う。

1. 取得
2. 分析
3. 承認

人間承認前に、次を実行しない。

- コード変更
- migration
- dashboard 変更

通知レビューの扱い:

- 取得は Gmail 検索または Gmail 連携などの外部手段で行う
- 分析結果は `docs/ai-team/` に記録する
- 承認後にのみ、Codex へ個別の実装依頼を出す
- 通知レビューとアプリ実装を直結しない

## 7. Supabase / DB 調査原則

- Supabase の実 DB 状態は、可能な限り AI が read-only で確認する
- migration と実 DB の差分は AI が整理する
- RLS / policy / trigger / function / migration 履歴の確認は AI が主導する
- SQL Editor の手作業確認を常態化しない
- 本番 DB 書き込み前だけ人間承認を求める
- `db push` や個別 SQL 適用の前には、対象、影響、想定リスク、rollback 方針有無をまとめてから止まる

## 8. docs 運用

各 docs の役割は次のとおり。

### `docs/product/`

- 確定事項のみを書く
- 現在の仕様、正式な方針、確定済みの運用状態を残す

### `docs/ai-team/`

- 検討
- 分析
- レビュー
- AI 運用ルール
- 承認前の判断材料
- handoff

### `PLANS.md`

- 将来案
- 未確定案
- 検討中の構想

### `tech-debt`

- 技術的負債
- 将来改善案
- 今すぐは着手しないが、後で改善が必要な内容

補足:

- 外部通知レビューの途中経過は `docs/ai-team/` に置く
- プロダクトの確定事項だけを `docs/product/` に反映する
- remote migration 履歴問題のような運用上の未解決課題も `docs/ai-team/` に整理する

## 9. 出力ルール

- 日本語で説明する
- 絵文字を使わない
- 「変更したファイル一覧」を必ず報告する
- 「なぜ必要か」を説明する
- 実装時は root cause を書く
- 変更範囲を限定して説明する

報告時の基本観点:

- 何を変えたか
- なぜ必要か
- どこまで変えたか
- 何を変えていないか
- 次に人間が確認すべきこと

## 10. Plan mode

`Plan only` の場合は、提案と実行を分離する。

禁止事項:

- file edit しない
- migration を作らない
- 実装しない

求められること:

- 提案内容を整理する
- 実行時の影響範囲を明示する
- 実装に進む前提条件を示す

## 11. 将来構想

Bloomlog は将来的に、次を検討している。

- Codex 並列運用
- AI 運用支援
- docs 駆動開発
- notification review automation

ただし、段階導入を原則とする。

- 未承認の大規模実装を行わない
- 将来構想を理由に先回り実装しない
- まずは最小構成で運用し、必要性が確認できた後に拡張する

## 12. 実装時の判断基準

実装に進む場合も、次の順で判断する。

1. docs に明示された要件か
2. 既存構造の中で対応できるか
3. 新規追加より既存修正で済むか
4. 変更範囲を小さく保てるか
5. root cause に対処しているか

不要な拡張より、既存構造に沿った最小修正を優先する。
