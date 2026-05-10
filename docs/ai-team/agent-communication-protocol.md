# Bloomlog Agent Communication Protocol

作成日: 2026-05-09

## 目的

このドキュメントは、Bloomlog Agent OS における Agent 間通信プロトコルを定義する。

Parent Agent / Writer Agent / Reviewer Agent / QA Agent / DB Inspector Agent / Sakura / Human は、チャットや人間コピペではなく、repo files / branch / PR / issue を正の通信路として使う。恒久的な役割定義は `docs/ai-team/agent-operating-model.md`、review / approval flow は `docs/ai-team/agent-review-workflow.md`、Mission 状態管理は `docs/ai-team/mission-lifecycle.md`、docs の配置と寿命は `docs/ai-team/agent-docs-map.md` に従う。

## 1. 基本原則

- Agent 間通信はチャットではなく repo files / branch / PR / issue を正とする。
- Human を Agent 間通信路にしない。
- Sakura も Agent 間通信路にしない。
- チャット出力は一時的な補助であり、最終状態は GitHub / repo に残す。
- docs-only は Agent 間共有メモリとして作業ブランチへ auto commit / push する。
- 起動不能を理由に、人間へ作業内容の転記を戻さない。
- Human intervention は approval gate に限定する。
- hidden memory、chat history、外部 AI の返答は source of truth ではない。Agent 間の共有状態は repo artifacts に戻す。
- repo-first autonomous workflow では、plan、task split、execution result、validation、review findings、approval gate 判断を、必要な粒度で Mission、Task、Report、Decision Log、PR、issue に残す。
- 複数 executor を使う場合は、bounded task ごとに branch、worktree、cloud task、subagent を分離し、Parent Agent が統合点を持つ。

## 2. 通信媒体の使い分け

| 媒体 | 何を書くか | 何を書かないか | 誰が読むか | いつ使うか | 寿命 | archive / close 条件 |
| --- | --- | --- | --- | --- | --- | --- |
| repo files | Mission、Task、Report、Decision Log、調査結果、handoff、運用ルール | secret、token、メール本文全文、一時チャットだけで足りる雑メモ | 全 Agent、Sakura、Human | Agent 間共有メモリが必要なとき | 短命から恒久 | docs map の寿命定義に従う |
| branch | 作業単位の commit 履歴、差分、docs-only 共有状態 | main へ直接入れる未確認変更 | 全 Agent、Sakura、Human | Mission または Task の作業中 | Task / PR 完了まで | merge、close、または archive 方針確定 |
| PR | code branch + PR path の変更内容、review、QA、merge 判断 | secret、未整理の長文チャット、承認前 production 手順だけの羅列 | Reviewer、QA、Parent、Sakura、Human | code change または main merge が必要なとき | merge / close まで | merge または close |
| issue | 未着手 Mission、承認待ち課題、外部通知レビュー、将来 Task | 実装済み事実の唯一の正本、secret | Parent、関係 Agent、Sakura、Human | branch や PR の前に課題を管理するとき | 課題解決まで | Task 化、PR 化、対応不要判断、close |
| commit message | 変更の短い要約 | 詳細 Report、secret、長い背景説明 | 全 Agent、Sakura、Human | commit 時 | 履歴として恒久 | archive しない |
| PR comment / review comment | review findings、QA 結果、差分への具体指摘 | Agent 間の唯一の handoff、secret | Reviewer、QA、Writer、Parent、Sakura、Human | PR review 中 | PR 寿命に従う | PR merge / close |
| chat | 作業中の短い進捗、最終報告、起動補助 | 正式 handoff、唯一の判断記録、全文コピペ前提の指示 | 現在の参加者 | 一時的な補助が必要なとき | 短命 | repo / GitHub に最終状態が残ったとき |

## 3. Mission directory structure

Mission が複数 Agent にまたがる場合は、次の構造を使う。

```text
docs/ai-team/missions/<mission-id>/
  mission.md
  tasks/
    parent.md
    writer.md
    reviewer.md
    qa.md
    db-inspector.md
  reports/
    writer-report.md
    reviewer-report.md
    qa-report.md
    db-inspector-report.md
    parent-summary.md
  decision-log.md
  approval-needed.md
```

Mission の lifecycle state と `mission.md` 必須状態フィールドは `docs/ai-team/mission-lifecycle.md` に従う。Parent Agent が integration / execution summary 後に更新し、Reviewer / QA は状態を直接変更しない。

### `mission.md`

役割:

- Mission の正本。

書くこと:

- mission id。
- 目的。
- 背景。
- 成功条件。
- 禁止事項。
- 対象 branch。
- path 分類。
- approval gate の有無。
- branch / worktree strategy。

### `tasks/parent.md`

役割:

- Parent Agent の統合タスク。

書くこと:

- 読むべき docs。
- repo grounding と plan。
- Task 分解。
- Agent 割り当て。
- integration 条件。
- Report 収集先。

### `tasks/writer.md`

役割:

- Writer Agent の実行タスク。

書くこと:

- 対象ファイル。
- 実装または docs 作成内容。
- 禁止変更。
- 完了条件。

### `tasks/reviewer.md`

役割:

- Reviewer Agent の review タスク。

書くこと:

- review 対象。
- docs-only / code change / DB 影響の確認観点。
- approval gate 判定。
- 完了条件。

### `tasks/qa.md`

役割:

- QA Agent の validation タスク。

書くこと:

- 実行するコマンド。
- 実行しない検証と理由。
- UI / build / lint / test / read-only SQL の観点。
- 完了条件。

### `tasks/db-inspector.md`

役割:

- DB Inspector Agent の read-only 調査タスク。

書くこと:

- 対象 table / policy / trigger / function / migration。
- read-only SQL。
- drift check 観点。
- rollback plan の要否。
- Human approval gate の要否。

### `reports/writer-report.md`

役割:

- Writer Agent の実行結果。

書くこと:

- changed files。
- diff summary。
- commands run。
- validation。
- risks。
- unknowns。

### `reports/reviewer-report.md`

役割:

- Reviewer Agent の review 結果。

書くこと:

- findings。
- docs-only safe path 判定。
- approval gate 判定。
- push を止める理由があるか。

### `reports/qa-report.md`

役割:

- QA Agent の検証結果。

書くこと:

- commands run。
- results。
- failed / skipped validation。
- residual risk。

### `reports/db-inspector-report.md`

役割:

- DB Inspector Agent の read-only 調査結果。

書くこと:

- introspection results。
- drift。
- migration generation の要否。
- repair candidate analysis。
- rollback。
- approval-needed 判定。

### `reports/parent-summary.md`

役割:

- Parent Agent の統合 Report。

書くこと:

- Mission 結果。
- Agent Report の要約。
- approval gate の有無。
- commit / PR / issue のリンクまたは識別子。
- next action。

### `decision-log.md`

役割:

- Mission 内の判断履歴。

書くこと:

- 決定日。
- 決定者。
- 決定内容。
- 選ばなかった案。
- 根拠。
- 見直し条件。

### `approval-needed.md`

役割:

- Human approval gate に入る事項の一覧。

書くこと:

- approval が必要な理由。
- 対象。
- 実行コマンドまたは SQL。
- risk。
- rollback。
- verification。

## 4. Agent handoff protocol

### Parent → Writer

- 入力ファイル: `mission.md`, `tasks/writer.md`, 関連 docs。
- 出力ファイル: `reports/writer-report.md`, 変更ファイル。
- 完了条件: Writer が Task を完了し、changed files / commands run / risks / unknowns を書く。
- 人間介入: no。

### Parent → Reviewer

- 入力ファイル: `mission.md`, `tasks/reviewer.md`, diff, `reports/writer-report.md`。
- 出力ファイル: `reports/reviewer-report.md`。
- 完了条件: docs-only 判定、approval gate 判定、findings が記録される。
- 人間介入: no。

### Parent → QA

- 入力ファイル: `mission.md`, `tasks/qa.md`, diff, Writer / Reviewer Report。
- 出力ファイル: `reports/qa-report.md`。
- 完了条件: validation 結果、未実行理由、残リスクが記録される。
- 人間介入: no。

### Parent → DB Inspector

- 入力ファイル: `mission.md`, `tasks/db-inspector.md`, 関連 migration / docs。
- 出力ファイル: `reports/db-inspector-report.md`。
- 完了条件: read-only introspection、drift check、rollback、approval-needed 判定が記録される。
- 人間介入: no。DB write が必要な場合のみ approval gate。

### Writer → Reviewer

- 入力ファイル: changed files, `reports/writer-report.md`。
- 出力ファイル: `reports/reviewer-report.md`。
- 完了条件: Reviewer が diff と Report を確認する。
- 人間介入: no。

### DB Inspector → Parent

- 入力ファイル: read-only SQL 結果、`reports/db-inspector-report.md`。
- 出力ファイル: `reports/parent-summary.md`, 必要に応じて `approval-needed.md`。
- 完了条件: Parent が DB risk と approval gate を統合する。
- 人間介入: no。approval gate に入る場合のみ yes。

### Reviewer → Parent

- 入力ファイル: `reports/reviewer-report.md`。
- 出力ファイル: `reports/parent-summary.md`。
- 完了条件: Parent が findings の解消状況または残リスクを整理する。
- 人間介入: no。

### QA → Parent

- 入力ファイル: `reports/qa-report.md`。
- 出力ファイル: `reports/parent-summary.md`。
- 完了条件: Parent が validation と残リスクを整理する。
- 人間介入: no。

### Parent → Human approval gate

- 入力ファイル: `reports/parent-summary.md`, `approval-needed.md`。
- 出力ファイル: Human approval 結果を含む `decision-log.md` または PR / issue comment。
- 完了条件: Human が承認または却下する。
- 人間介入: yes。理由は approval gate。

### Sakura → Parent review feedback

- 入力ファイル: `mission.md`, `reports/parent-summary.md`, 関連 docs / PR / issue。
- 出力ファイル: `decision-log.md`、PR / issue comment、または Parent への review feedback。
- 完了条件: 方針レビュー、人間意図の翻訳、監査観点の補強が記録される。
- 人間介入: no。Sakura は通信路ではなく review feedback の提供者。

## 5. Trigger model

- Parent Agent が他 Agent を魔法のように自動起動できるとは限らない。
- 各 Agent は repo 内 task file / GitHub issue / PR を trigger として動く。
- 手動起動が必要な場合でも、人間が貼るのは長文指示ではなく task file path のみとする。
- 将来的には GitHub issue / Codex task / PR comment から起動する形に寄せる。
- 起動不能を理由に人間に作業内容を転記させない。
- Agent が起動できない場合、Parent Agent は task file を整備し、次に起動する Agent が読める状態で branch へ commit / push する。

## 6. Report contract

各 Agent report には必ず次を含める。

- mission id。
- task id。
- agent role。
- input files。
- output files。
- commands run。
- changed files。
- validation。
- risks。
- rollback。
- unknowns。
- next action。
- whether human approval is required。

## 7. Auto commit / push communication

- docs-only report / task / decision log は auto commit / push 対象である。
- Reviewer Agent が docs-only safe path 条件を確認したら、AI は作業ブランチへ commit / push してよい。
- code changes は feature branch + PR に集約する。
- DB / migration execution は approval gate に入る。
- auto commit / push 後は branch name / commit SHA / changed files だけ報告する。
- 人間に全文コピペさせない。
- Sakura は GitHub から読む。
- ローカル未コミットで止める場合は、具体的なリスク理由を Report に書く。

## 8. Anti-patterns

禁止する。

- Agent 結果を Human が別 Agent へ貼る。
- Sakura が毎回 Codex 指示文を作り直す。
- ローカル未コミット docs を人間にコピペさせる。
- チャットだけで handoff する。
- diff 確認を Human へ戻す。
- 「起動できないから人間が作業する」に戻る。
- approval gate ではない docs-only commit / push を Human 承認待ちで止める。
- secret、token、メール本文全文を repo files に保存する。

## 9. Human intervention table

| Step | Default actor | Communication medium | Human intervention? | If yes, why | Output location |
| --- | --- | --- | --- | --- | --- |
| Mission 作成 | Parent Agent | repo files / issue | no | なし | `mission.md` or issue |
| Task 分解 | Parent Agent | repo files | no | なし | `tasks/*.md` |
| Writer 実行 | Writer Agent | branch / repo files | no | なし | changed files, `writer-report.md` |
| Reviewer review | Reviewer Agent | repo files / PR review | no | なし | `reviewer-report.md` or PR review |
| QA validation | QA Agent | repo files / PR comment | no | なし | `qa-report.md` |
| DB read-only introspection | DB Inspector Agent | repo files | no | なし | `db-inspector-report.md` |
| docs-only commit / push | AI | branch / commit | no | なし | branch commit |
| code PR 作成 | Parent Agent / Writer Agent | PR | no | なし | PR |
| main merge | Human | PR | yes | main 反映の approval gate | PR merge |
| migration generation | Writer Agent / DB Inspector Agent | branch / repo files | no | 明示依頼または承認済み scope 内で作成。適用は別 gate | migration file / report |
| migration apply | DB Inspector Agent after approval | approval-needed / PR / issue | yes | production DB write | execution log / report |
| migration repair | DB Inspector Agent after approval | approval-needed / PR / issue | yes | migration history write | execution log / report |
| `db push` | DB Inspector Agent after approval | approval-needed / PR / issue | yes | production DB write | execution log / report |
| destructive SQL | DB Inspector Agent after approval | approval-needed / PR / issue | yes | destructive production risk | execution log / report |
| secret 変更 | Human or approved operator | issue / dashboard | yes | secret update | decision log / report without secret |
| dashboard setting | Human or approved operator | issue / dashboard | yes | production setting change | decision log / report |
| Sakura review | Sakura | PR / issue / repo files | no | Sakura は approval gate ではない | review feedback / decision log |
| Archive 判断 | Parent Agent / Reviewer Agent | repo files / issue | yes if moving files | archive 移動は例外操作 | archive task / PR |

## 禁止事項

- `app/`、`lib/`、`supabase/`、`package.json`、`.env*` をこの protocol 作成のために変更しない。
- DB write をしない。
- migration repair をしない。
- `db push` をしない。
- archive 移動をしない。
- ファイル削除をしない。
- secret を保存しない。
- メール本文全文を保存しない。
