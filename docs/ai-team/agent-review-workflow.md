# Bloomlog Agent Review Workflow

> Historical note: この文書は AI Team experiment era の review workflow 資料であり、通常の Codex 開発の正本ではない。
> 現在の通常開発では issue / branch / PR / final report と root `AGENTS.md` を優先する。

作成日: 2026-05-09

## 目的

このドキュメントは、Bloomlog Agent OS における review / approval flow を定義する。

AI Agent がどこまで自律実行し、どこで Reviewer / QA / Parent が介入し、どこで Human approval gate に入るかを明確にする。恒久的な役割定義は `docs/ai-team/agent-operating-model.md` を正とし、Mission 状態管理は `docs/ai-team/mission-lifecycle.md`、docs の配置と寿命は `docs/ai-team/agent-docs-map.md` に従う。

## 基本原則

- AI は作業者であり、人間は承認者である。
- 人間を diff 比較係、転記係、スクリーンショット係、通信路にしない。
- AI が可能な read-only introspection、diff 確認、検証、rollback 案作成は AI が行う。
- 本番 DB write、destructive SQL、secret 変更、dashboard 設定変更、main merge は Human approval gate で止める。
- Mission、Task、Report、Review、Approval、Execution、Verification、Archive の状態を repo files、branch、PR、issue に残す。
- Review flow は `docs/ai-team/ai-is-to-be-architecture.md` の repo-first autonomous workflow に従う。非自明な作業は、repo grounding、plan、task split、execution、validation、review、approval gate、PR / final report の順で扱う。
- strict schema / machine-readable state / path enforcement tool は将来候補であり、現行 v1 の review flow では必須導入条件にしない。

## review flow

### 1. Mission 作成

Mission は作業の目的単位である。

Parent Agent が行うこと:

- Human または Sakura の意図を Mission として整理する。
- 目的、背景、成功条件、禁止事項、approval gate の有無を明確にする。
- `AGENTS.md`、`docs/product/`、`docs/ai-team/agent-operating-model.md`、`docs/ai-team/agent-docs-map.md` を確認する。
- docs-only safe path、code branch + PR path、DB / migration path のどれに入るか判断する。
- 必要に応じて、実装前 plan と branch / worktree strategy を作る。

### 2. Task 分解

Parent Agent は Mission を Task に分解する。

Task に含めること:

- 担当 Agent。
- 対象ファイルまたは対象領域。
- 実行内容。
- 検証内容。
- Report の出力先。
- approval gate の有無。
- 並列化する場合の branch / worktree / cloud task の分離方針。

### 3. Writer 実行

Writer Agent は Task に沿って変更を行う。

Writer Agent が行うこと:

- 既存構造、既存 UI、既存用語を優先する。
- 最小変更で root cause に対処する。
- docs-only safe path では `docs/` 配下に限定する。
- code branch + PR path では関連テストと docs 更新も検討する。
- DB / migration 影響が見えた場合は、実装を止めて DB Inspector Agent と Parent Agent に戻す。

### 4. Reviewer review

Reviewer Agent は diff と設計整合性を確認する。

確認すること:

- 仕様逸脱がないか。
- Bloomlog 固定用語を変えていないか。
- 過剰実装や不要な構造追加がないか。
- `docs/product/` と `docs/ai-team/` の責務が混ざっていないか。
- 禁止変更が含まれていないか。
- DB、secret、dashboard、production write の approval gate が必要か。

### 5. QA validation

QA Agent は検証を設計し、AI が実行可能な検証を実行する。

検証候補:

- `git diff --name-only`
- `git diff --stat`
- lint
- build
- test
- UI のブラウザ確認
- read-only SQL
- migration drift check

実行できない検証がある場合:

- 理由を書く。
- 残リスクを書く。
- 次に必要な検証を書く。

### 6. Parent integration

Parent Agent は Writer、Reviewer、QA、DB Inspector の結果を統合する。

統合するもの:

- diff summary。
- 検証結果。
- risk。
- rollback。
- unknowns。
- next action。
- approval gate の要否。

### 7. docs-only auto commit/push

docs-only safe path では、Reviewer Agent が条件を確認したら、AI は作業ブランチへ commit / push してよい。Human は docs-only commit / push の通常承認者ではなく、例外時の承認者である。

条件:

- 変更が `docs/` 配下に限定されている。
- app / lib / supabase / migrations / package / `.env*` が変更されていない。
- DB write、migration repair、`db push` がない。
- archive 移動やファイル削除がない。
- staged file が対象 docs のみである。
- Reviewer Agent が docs-only safe path 条件を確認している。

ローカル未コミットで止める場合は、具体的なリスク理由を Report に書く。

### 8. feature branch + PR

コード変更を含む場合は feature branch + PR path に入る。

行うこと:

- branch を作成する。
- 実装、検証、review を行う。
- PR description に Report を書く。
- Human approval gate を通して merge する。

### 9. Human approval gate

Human approval gate は、AI が実行可能な調査と準備を終えたあとに入る。

gate に入る前に AI が準備すること:

- 対象。
- 実行内容。
- diff。
- risk。
- rollback。
- unknowns。
- 検証済み事項。
- 実行後の verification。

### 10. merge / production execution

Human approval 後にのみ、main merge または production execution に進む。

production execution に含まれるもの:

- migration apply。
- migration repair。
- `db push`。
- destructive SQL。
- secret 変更。
- dashboard 設定変更。
- production write。

## Agent ごとの責務

### Parent Agent

- Mission を定義する。
- Task を分解する。
- path を選ぶ。
- Agent の成果物を repo files、branch、PR、issue に集約する。
- approval gate で止める。
- Report と next action をまとめる。

### Writer Agent

- Task に沿って docs または code を変更する。
- 既存構造と固定用語を守る。
- scope creep を避ける。
- DB / migration / secret / dashboard 影響を見つけたら Parent Agent に戻す。

### Reviewer Agent

- diff review を行う。
- 禁止変更と approval gate の見落としを確認する。
- docs-only safe path では変更対象が docs のみか確認する。
- PR では仕様逸脱、過剰実装、テスト不足、risk を指摘する。

### QA Agent

- lint、build、test、UI 確認、read-only SQL などの検証を設計する。
- AI が実行できる検証は実行する。
- 実行できない検証と残リスクを Report に書く。

### DB Inspector Agent

- DB / RLS / policy / trigger / function / migration を read-only introspection する。
- migration drift を確認する。
- migration generation の必要性を整理する。
- rollback plan を作る。
- repair candidate analysis を行う。
- Human approval gate 前に DB write をしない。

### Sakura

- 外部監査、方針レビュー、人間意図の翻訳を行う。
- AI の提案が Bloomlog の体験価値と固定用語から外れていないか確認する。
- Human の代わりに最終承認をしない。
- 本番操作の実行者にならない。

### Human

- approval gate で承認または却下する。
- main merge を承認する。
- production execution を承認する。
- AI が実行できる調査、diff 比較、転記、検証の代行はしない。

## docs-only safe path

docs-only safe path は、`docs/` 配下の Markdown だけを変更する経路である。

### 自動 commit / push 条件

- Reviewer Agent が docs-only safe path 条件を確認している。
- `git status --short` で docs 以外の変更がない。
- `git diff --cached --name-only` が対象 docs のみである。
- `git diff --cached --stat` で docs-only と確認できる。
- 既存 MD の大幅改修、archive 移動、ファイル削除を含まない。
- secret、メール本文全文、token が含まれていない。
- Human approval が必要な例外に該当しない。

Human は docs-only commit / push の通常承認者ではなく、例外時の承認者である。

### Human approval が必要な例外

- `app/`
- `lib/`
- `supabase/`
- `supabase/migrations/`
- `package.json`
- `.env*`
- secret / token / メール本文全文を含む可能性がある。
- DB write。
- migration repair。
- `db push`。
- archive 移動。
- ファイル削除。
- `docs/product/` の正式仕様を大幅変更する場合。
- `AGENTS.md` や `docs/ai-team/agent-operating-model.md` など上位ルールを破壊的に変更する場合。

### 禁止変更

- `app/`
- `lib/`
- `supabase/`
- `supabase/migrations/`
- `package.json`
- `.env*`
- archive 移動
- ファイル削除
- DB write
- migration repair
- `db push`

### branch policy

- 原則として現在の作業 branch に commit する。
- 指定 branch がある場合は、その branch にいることを確認する。
- main へ直接 push しない。
- docs-only safe path でも、branch が不明な場合は `git branch --show-current` を確認する。

### push を止める条件

- staged file に docs 以外が含まれる。
- `app/`、`lib/`、`supabase/`、`package.json`、`.env*` が含まれる。
- archive 移動またはファイル削除が含まれる。
- approval gate が必要な内容を含む。
- secret、token、メール本文全文が含まれる可能性がある。
- branch が指定と違う。
- `docs/product/` の正式仕様を大幅変更する。
- `AGENTS.md` や `docs/ai-team/agent-operating-model.md` など上位ルールを破壊的に変更する。

ローカル未コミットで止める場合は、具体的なリスク理由を Report に書く。

## code branch + PR path

code branch + PR path は、アプリコード、ライブラリ、Supabase 設定、package 関連に触れる可能性がある経路である。

### app / lib / supabase / package 変更時の flow

1. Parent Agent が Mission と scope を確認する。
2. Writer Agent が最小変更で実装する。
3. Reviewer Agent が diff review を行う。
4. QA Agent が lint / build / test を実行する。
5. DB Inspector Agent が DB / migration 影響を確認する。
6. Parent Agent が PR Report を作る。
7. Human が PR review と merge を承認する。

### build / lint / test

原則として AI が実行する。

実行候補:

- lint
- build
- unit test
- typecheck
- 関連する UI 動作確認

実行できない場合:

- 実行できなかった理由を書く。
- 代替確認を書く。
- 残リスクを書く。

### PR review

PR には次を含める。

- 目的。
- 変更内容。
- 変更ファイル。
- 検証結果。
- DB / migration / secret / dashboard 影響の有無。
- risk。
- rollback。
- unknowns。
- next action。

### merge 条件

- Reviewer review が完了している。
- QA validation が完了している、または未実行理由と残リスクが明記されている。
- docs 更新が必要な場合は更新済み。
- approval gate が必要な項目は Human が承認済み。
- main merge は Human approval gate を通過している。

## DB / migration path

DB / migration path は、DB、RLS、policy、trigger、function、migration 履歴に影響する可能性がある経路である。

### read-only introspection

DB Inspector Agent が行う。

対象:

- schema。
- RLS。
- policy。
- trigger。
- function。
- migration 履歴。
- repo migration。
- remote drift。

### migration generation

migration 作成は明示依頼または承認がある場合のみ行う。

作成前に確認すること:

- docs に明示された要件か。
- 既存構造の中で対応できるか。
- migration なしで解決できないか。
- rollback plan を作れるか。
- 本番適用 gate が必要か。

### rollback plan

DB / migration path では rollback plan を作る。

含めること:

- 戻す対象。
- rollback SQL または戻し方。
- rollback が危険な場合の理由。
- backup や検証の必要性。
- rollback 後の verification。

### drift check

drift check は AI が行う。

確認すること:

- repo migration と remote schema の差分。
- remote migration 履歴。
- RLS / policy / trigger / function の現状。
- `db push` が過剰適用にならないか。
- 個別 SQL 適用の方が安全か。

### repair candidate analysis

`migration repair` は write を伴うため、人間承認前には実行しない。

AI が行うこと:

- repair が候補になる理由を整理する。
- applied として登録すべき migration の候補を整理する。
- repo と remote schema の一致度を確認する。
- repair 後に `db push` をどう扱うか整理する。
- risk と rollback を書く。

### Human approval gate

次は Human approval gate が必要である。

- migration apply。
- migration repair。
- `db push`。
- destructive SQL。
- production DB write。
- dashboard 上の DB 設定変更。

### production execution

Human approval 後にのみ実行する。

実行後に必要なこと:

- 実行コマンドまたは SQL を記録する。
- 結果を確認する。
- read-only verification を行う。
- Report と introspection log を更新する。
- rollback が不要になったか、まだ必要かを書く。

## Human approval gates

以下は必ず Human approval gate に入る。

- main merge。
- migration apply。
- migration repair。
- `db push`。
- destructive SQL。
- secret 作成、更新、削除。
- dashboard setting 変更。
- production write。
- 課金、ドメイン、認証 provider、redirect URL など実運用設定。
- 大規模構造変更。

approval request に含めること:

- 対象。
- 実行内容。
- 実行コマンドまたは SQL。
- diff。
- risk。
- rollback。
- unknowns。
- verification。
- approval 後に AI が実行する範囲。

## report contract

Agent は Report に次を書く。

### 必須項目

- Mission。
- Task。
- 担当 Agent。
- 変更内容。
- 変更ファイル。
- 実行コマンド。
- diff summary。
- validation。
- risk。
- rollback。
- unknowns。
- next action。

### 実行コマンド

書くこと:

- 実行したコマンド。
- 成功または失敗。
- 失敗した場合の理由。
- 実行しなかった検証と理由。

### diff

書くこと:

- `git diff --name-only` 相当の変更ファイル。
- `git diff --stat` 相当の規模。
- docs-only か code change か。
- approval gate が必要なファイルが含まれるか。

### risk

書くこと:

- 仕様リスク。
- UI 文言リスク。
- DB / RLS / auth リスク。
- secret / dashboard リスク。
- production リスク。
- 残リスク。

### rollback

書くこと:

- 戻し方。
- rollback が不要な理由、または未作成の理由。
- DB の場合は rollback SQL または代替方針。

### unknowns

書くこと:

- 未確認事項。
- 判断保留事項。
- Human または Sakura の判断が必要な事項。

### next action

書くこと:

- 次に作る docs。
- 次に必要な Task。
- approval gate に進むか。
- PR を作るか。
- archive 候補があるか。

## anti-patterns

禁止する。

- 人間を diff 比較係に戻す。
- 人間を転記係に戻す。
- 「まずスクショ」で人間に確認を返す。
- 「まず docs」とだけ言って調査や整理を止める。
- 「安全のため停止」とだけ言って、AI が可能な read-only 調査をしない。
- チャットだけで Agent 間の状態共有を済ませる。
- Report なしに commit / push する。
- approval gate を曖昧にしたまま production execution に進む。
- migration / DB / secret / dashboard の判断材料を作らず Human に丸投げする。

## state transition

Lifecycle status の正本は `docs/ai-team/mission-lifecycle.md` と `mission.md` の状態フィールドである。この章は review flow の段階説明として扱う。

### 1. Mission

目的、成功条件、禁止事項、approval gate を定義する。

次へ進む条件:

- path が決まっている。
- 必要 docs を読んでいる。
- scope が明確である。

### 2. Task

Mission を実行可能な単位に分解する。

次へ進む条件:

- 担当 Agent が決まっている。
- 対象ファイルまたは対象領域が明確である。
- 完了条件がある。

### 3. Report

Writer / DB Inspector / QA が実行結果を残す。

次へ進む条件:

- 変更内容、実行コマンド、diff、risk、rollback、unknowns、next action が書かれている。

### 4. Review

Reviewer Agent が Report と diff を確認する。

次へ進む条件:

- 指摘が解消済み、または残リスクとして明記済み。
- approval gate の要否が明確である。

### 5. Approval

Human approval gate が必要な場合に入る。

次へ進む条件:

- Human が承認した。
- または approval 不要であることが Report に明記されている。

### 6. Execution

commit / push、PR、merge、production execution を行う。

次へ進む条件:

- 許可された範囲だけ実行している。
- 実行結果が記録されている。

### 7. Verification

実行後の検証を行う。

次へ進む条件:

- 検証結果が Report にある。
- 未確認事項が unknowns にある。
- 次 action が明確である。

### 8. Archive

短命 docs、handoff、checklist を現行入口から外す。

次へ進む条件:

- archive 条件を満たしている。
- 必要な判断が decision log または product docs に反映されている。
- archive 移動が別 Task として承認されている。

## 禁止事項

- `app/`、`lib/`、`supabase/`、`package.json`、`.env*` をこの docs 作成のために変更しない。
- DB write をしない。
- migration repair をしない。
- `db push` をしない。
- archive 移動をしない。
- ファイル削除をしない。
- Bloomlog 固定用語を変更しない。
