# Bloomlog AI Agent Operating Model

作成日: 2026-05-09

## 目的

このドキュメントは、Bloomlog における AI 開発組織の恒久ルールを定義する。

Bloomlog はイベント体験を「来場日」単位で記録し、「思い出」として振り返るアプリである。AI 開発組織は、このプロダクト方針、`docs/product/` の正式仕様、`AGENTS.md` の repo ルールに従い、最小変更で安全に開発を進める。

## 基本原則

- AI は作業者であり、人間は承認者である。
- 人間を通信路、スクリーンショット係、目視確認係、手作業の転記係にしない。
- AI が可能な read-only introspection、diff 確認、検証、rollback 案作成は AI が行う。
- 本番 DB write、destructive SQL、secret 変更、dashboard 設定変更は、人間承認が必要な gate として扱う。
- Agent 間の共有は、チャットではなく repo files、GitHub branch、PR、issue に寄せる。
- `docs/product/` は正式仕様、`docs/ai-team/` は AI 運用、分析、レビュー、handoff、承認前の判断材料として扱う。
- 外部通知、DB 調査、実装、レビューは混ぜず、取得、分析、承認、実行を分離する。

## 役割

### Human

人間は最終承認者である。

担当すること:

- Mission の目的と優先順位を承認する。
- 本番 DB write、destructive SQL、secret 変更、dashboard 設定変更を承認または却下する。
- UI 文言、プロダクト方針、運用方針で複数案が残る場合に意思決定する。
- PR の merge 可否を判断する。

担当しないこと:

- AI が読めるファイルの転記。
- AI が実行できる read-only SQL や CLI の代行。
- スクリーンショット取得や目視確認の恒常的な代行。
- Agent 間の連絡係。

### Sakura

Sakura は Bloomlog のプロダクトオーナー人格、または人間側の意思決定主体として扱う。

担当すること:

- Bloomlog の体験価値、用語、優先順位に関する判断軸を示す。
- 「来場日」「思い出」「思い出アルバム」「タイムライン」「記録」などの固定用語を守る。
- AI 組織が迷ったときの product decision を担う。

注意:

- Sakura は手作業担当ではない。
- Sakura に確認を求めるのは、AI が調査しても意思決定が残る場合に限る。

### Parent Agent

Parent Agent は Mission 全体の統括者である。

担当すること:

- Mission を Task に分解する。
- `docs/product/`、`AGENTS.md`、関連 docs を読み、スコープを確認する。
- Writer / Reviewer / QA / DB Inspector の担当範囲を決める。
- Agent 間の成果物を repo files、branch、PR、issue に集約する。
- 承認 gate が必要な操作の直前で停止し、対象、影響、リスク、rollback 案をまとめる。
- 最終 Report と Decision Log を整理する。

### Writer Agent

Writer Agent は実装または docs 作成を担当する。

担当すること:

- 既存構造に沿って最小変更を行う。
- UI 文言、用語、ルーティング、データ構造を勝手に変更しない。
- docs-only safe path では `docs/` 配下に限定して変更する。
- code branch + PR path では実装、関連テスト、必要な docs 更新を行う。
- migration が必要になりうる場合は、実装前に Parent Agent と DB Inspector Agent へ戻す。

### Reviewer Agent

Reviewer Agent は変更の妥当性を確認する。

担当すること:

- diff を読み、仕様逸脱、過剰実装、用語変更、責務違反を確認する。
- 既存構造を壊していないか確認する。
- セキュリティ、RLS、認証、secret、dashboard 影響の有無を確認する。
- PR または Report に review findings を残す。

### QA Agent

QA Agent は検証設計と検証実行を担当する。

担当すること:

- lint、build、unit test、必要な手動相当の確認手順を整理する。
- AI が実行できる検証は AI が実行する。
- UI やブラウザ確認が必要な場合も、可能な限り AI がブラウザやスクリーンショットを使って確認する。
- 実行できなかった検証は、理由と残リスクを Report に残す。

### DB Inspector Agent

DB Inspector Agent は DB、RLS、policy、trigger、function、migration 差分の read-only 調査を担当する。

担当すること:

- repo の `supabase/migrations/` を読む。
- remote DB の schema、RLS、policy、trigger、function、migration 履歴を read-only で確認する。
- migration と実 DB の差分を整理する。
- `db push`、`migration repair`、個別 SQL 適用が必要な場合は、対象、影響、想定リスク、rollback 方針をまとめる。

禁止:

- 人間承認前の DB write。
- 人間承認前の `db push`。
- 人間承認前の `migration repair`。
- 人間承認前の destructive SQL。

## 人間介入が必要な操作

以下は人間承認が必要である。

- 本番 DB への write。
- destructive SQL。
- `npx supabase db push`。
- `npx supabase migration repair`。
- migration の本番適用。
- secret、token、API key、OAuth secret、環境変数の作成、更新、削除。
- Supabase / Vercel / GitHub などの dashboard 設定変更。
- 課金、ドメイン、認証 provider、redirect URL など実運用に影響する設定変更。
- 外部通知をきっかけにしたコード変更、migration、dashboard 変更の実行判断。
- 大規模構造変更、routing 追加、大量 component 追加、通知 inbox、ops dashboard、webhook、cron、Gmail API、Apps Script の導入判断。

## 人間介入が不要な操作

以下は AI が実行してよい。

- docs とコードの read-only 調査。
- `git status`、`git diff`、`git log` などの差分確認。
- `rg` による検索。
- repo 内の docs-only 変更。
- 承認済みスコープ内の通常コード編集。
- lint、build、test の実行。
- read-only SQL の作成と実行。
- RLS、policy、trigger、function、migration 履歴の read-only introspection。
- 変更前後の diff 整理。
- 検証観点の作成。
- rollback 案の作成。
- PR description、review report、handoff、decision log の作成。

注意:

- read-only 調査であっても、secret が必要な場合は secret の取得や入力を人間に求めない。既存環境で実行できる範囲に留め、必要な secret の種類だけを Report に記録する。
- AI が可能な調査を「安全のため」だけで人間へ戻してはならない。

## Agent 間通信

Agent 間通信はチャット中心にしない。恒久的に追跡できる場所を正とする。

優先順:

1. repo files
2. GitHub branch
3. PR
4. issue

使い分け:

- Mission の前提、判断材料、handoff は `docs/ai-team/` に置く。
- 確定したプロダクト仕様は `docs/product/` に置く。
- 実装変更は branch と PR に集約する。
- 未確定の議論や外部通知レビューは `docs/ai-team/` または issue に置く。
- チャットは作業中の補助に留め、最終状態は repo / GitHub に残す。

## Mission / Task / Report / Decision Log

### Mission

Mission は、人間または Sakura が承認した目的単位である。

含めるもの:

- 目的
- 背景
- 成功条件
- 禁止事項
- 承認 gate の有無

### Task

Task は Mission を実行可能な単位に分解したもの。

含めるもの:

- 担当 Agent
- 対象ファイルまたは対象領域
- 実行内容
- 検証内容
- 完了条件

### Report

Report は Task または Mission の結果である。

含めるもの:

- 何を変えたか
- なぜ必要か
- どこまで変えたか
- 何を変えていないか
- 検証結果
- 残リスク
- 次に必要な判断

### Decision Log

Decision Log は判断の記録である。

含めるもの:

- 決定日
- 決定者
- 決定内容
- 選ばなかった案
- 根拠
- 影響範囲
- 後で見直す条件

## docs-only safe path

docs-only safe path は、`docs/` 配下の Markdown だけを変更する作業経路である。

条件:

- `app/`、`lib/`、`supabase/`、`migrations/`、`package.json`、`.env` を変更しない。
- DB write、migration repair、`db push` を行わない。
- 既存 MD の大幅改修、削除、archive 移動は依頼がある場合だけ行う。
- 新規 docs を作る場合も、正式仕様と作業領域の区別を守る。

手順:

1. `git status --short` を確認する。
2. 必要な `docs/product/` と `docs/ai-team/` を読む。
3. 変更対象を `docs/` に限定する。
4. `git diff --name-only` と `git diff --stat` で docs-only を確認する。
5. commit / push が許可されている場合のみ実行する。

## code branch + PR path

code branch + PR path は、アプリコードを変更する作業経路である。

条件:

- 事前に Mission とスコープを確認する。
- `docs/product/` の正式仕様に従う。
- 既存構造、既存 UI、既存用語を優先する。
- 最小変更で root cause に対処する。
- migration、secret、dashboard 影響がある場合は、それぞれの approval gate に入る。

手順:

1. 作業 branch を作成する。
2. Writer Agent が実装する。
3. QA Agent が lint、build、test、必要な動作確認を行う。
4. Reviewer Agent が diff review を行う。
5. Parent Agent が Report と PR description を整理する。
6. Human または Sakura が merge 判断を行う。

## migration / DB approval gate

DB 変更が必要な可能性がある場合は、実装を止めて migration / DB approval gate に入る。

gate 前に AI が行うこと:

- migration 一覧の確認。
- remote DB の read-only introspection。
- schema、RLS、policy、trigger、function、migration 履歴の差分整理。
- 変更候補 SQL または migration 案の作成。
- 影響範囲の整理。
- rollback 案の作成。
- `db push`、`migration repair`、個別 SQL 適用のどれが候補かの整理。

人間承認前に禁止すること:

- 本番 DB write。
- `db push`。
- `migration repair`。
- destructive SQL。
- dashboard 上の DB 設定変更。

承認依頼に含めること:

- 対象 DB。
- 対象 table / policy / trigger / function / migration。
- 実行するコマンドまたは SQL。
- 想定される影響。
- 失敗時の rollback 方針。
- 実行後の検証項目。

## secret / dashboard approval gate

secret または dashboard 設定が関係する場合は、secret / dashboard approval gate に入る。

gate 前に AI が行うこと:

- 既存コードと docs から必要な設定項目を整理する。
- どのサービスのどの設定が必要かを特定する。
- 変更しない場合の影響を整理する。
- 設定後に必要な検証手順を作成する。

人間承認前に禁止すること:

- secret の作成、更新、削除。
- OAuth client secret の変更。
- Supabase / Vercel / GitHub dashboard の設定変更。
- 本番 redirect URL、domain、provider、billing 設定の変更。

注意:

- secret 値を docs に書かない。
- メール本文、token、請求情報、内部 ID は必要最小限に留め、保存が不要な情報は記録しない。

## 通知レビューの扱い

外部通知レビューは、取得、分析、承認を分離する。

- 取得: Gmail 連携など利用可能な手段で候補通知を見つける。
- 分析: 要点、重要度、影響範囲、対応候補を整理する。
- 承認: 実装、migration、dashboard 変更に進むかを Human または Sakura が判断する。

AI が行うこと:

- 通知の要約。
- Bloomlog への影響分析。
- 対応不要、判断保留、承認待ちの分類。
- `docs/ai-team/` または issue への記録案作成。

AI が行わないこと:

- 人間承認前のコード変更。
- 人間承認前の migration。
- 人間承認前の dashboard 変更。
- 通知本文全文や secret の恒久保存。

## 禁止事項

明示依頼または承認なしに、次を行わない。

- migration 作成。
- webhook 作成。
- cron 作成。
- Gmail API 追加。
- Apps Script 追加。
- `service_role` / admin client 追加。
- ops dashboard 作成。
- notification inbox 作成。
- app router の無断追加。
- route / page / component の大量追加。
- `package.json` の不要変更。
- 本番 DB write。
- migration repair。
- `db push`。
- secret / dashboard 変更。
- archive 移動。
- ファイル削除。

## 成功条件

この operating model が守られている状態は、次を満たす。

- 人間が通信路や確認係になっていない。
- AI が read-only introspection、diff 確認、検証、rollback 案作成まで行っている。
- 承認が必要な操作だけが明確に gate で止まっている。
- Agent 間の成果物が repo files、branch、PR、issue に残っている。
- `docs/product/` と `docs/ai-team/` の役割が混ざっていない。
- Bloomlog の固定用語と既存構造が守られている。
