# Bloomlog AI-IS TO-BE Architecture

> Historical note: この文書は AI Team experiment era の TO-BE 検討資料であり、通常の Codex 開発の正本ではない。
> 現在の通常開発では独自 AI 組織構造を前提にせず、root `AGENTS.md` と domain `AGENTS.md` を優先する。

作成日: 2026-05-10

## 1. Purpose

このドキュメントは、Bloomlog AI-IS（AI Integration System / AI Team Operating System）の TO-BE architecture を、Claude Code 的な repo-first autonomous workflow として定義する。

Bloomlog AI-IS は、会話を作業の入口として使うが、会話そのものを正本にしない。正本は repo に置かれた `AGENTS.md`、`docs/product/`、`docs/ai-team/`、Mission、Task、Report、Decision Log、branch、PR、issue、validation result である。

この TO-BE では、以前の細かい schema-first / layer-first / state-enforcement-first 設計を採用しない。strict schema、machine-readable state、path enforcement tool は将来の補助候補として扱うが、v1 の中心には置かない。中心に置くのは、次の自律実行ループである。

```text
repo grounding -> plan -> task split -> execution -> validation -> review -> approval gate -> PR / final report
```

このドキュメントは設計方針であり、この文書単体では Skill 化、Plugin 化、MCP 実装、hook 追加、cloud task、scheduler、外部 controller、state json 作成、app / lib / supabase / migrations / package.json / `.env*` 変更、DB write、dashboard change を行わない。

## 2. Core Principle

- Repo が正本である。chat、memory、口頭補足、外部 AI の返答は draft input または補助情報に留める。
- `AGENTS.md` は Bloomlog AI-IS の入口であり、repo operating contract として扱う。
- `docs/product/` は Bloomlog の正式仕様であり、固定用語、体験価値、ドメイン構造の正本である。
- `docs/ai-team/` は AI 運用、調査、レビュー、handoff、承認前判断材料の置き場である。
- Plan は実装前の必須 stage である。非自明な作業は、先に読むべき docs、変更範囲、検証、approval gate、停止条件を plan で明確にする。
- Execution は bounded task 単位で行う。独立した作業は branch、worktree、cloud task、subagent の単位で分離し、同じ作業ツリーを複数主体で同時に汚さない。
- 自律性は validation、review、approval gate で制御する。AI は実行者であり、Human は承認者である。
- Human を転記係、diff 確認係、スクリーンショット係、Agent 間通信路にしない。
- hidden memory を source of truth にしない。必要な状態、判断、残リスク、検証結果は repo artifact に戻す。
- 大規模な swarm、cron、webhook、dashboard、notification inbox、Gmail API、Apps Script、`service_role` / admin client は、明示承認なしに導入しない。

## 3. Workflow Model

### Intake

作業入口は Human、Sakura、通知レビュー、issue、PR、CI、外部調査結果のいずれでもよい。ただし intake の時点では draft であり、execution-ready ではない。

Intake で行うこと:

- 目的、背景、優先度、期待する成果を短く整理する。
- Bloomlog 固定用語への影響があるか確認する。
- production write、DB、secret、dashboard、main merge、大規模構造変更の可能性を早期に見る。
- 通知レビューでは raw email body、secret、dashboard URL、project ID、内部 ID を repo に保存しない。

### Repo Grounding

AI は実装前に repo を読む。最初に `AGENTS.md` を読み、必要に応じて `docs/product/`、`docs/ai-team/mission-lifecycle.md`、`docs/ai-team/agent-docs-map.md`、対象 Mission、関連コード、関連 migration を確認する。

Repo grounding で行うこと:

- 現在の正式仕様と固定用語を確認する。
- 既存構造、既存責務、既存運用 docs を確認する。
- 既存 Mission が `completed` / `superseded` の場合は再開しない。
- 新規 docs を作る前に、既存 docs / mission / decision log / report に追記できないか確認する。

### Plan

Plan は実装前に、作業を安全に実行できる粒度へ落とす stage である。

Plan に含めるもの:

- goal。
- scope。
- out of scope。
- files / docs to inspect or change。
- execution path。
- validation plan。
- review plan。
- approval gate の有無。
- branch / worktree strategy。
- stop conditions。

Plan は会話だけで完結させない。長く続く作業、複数 Agent が関わる作業、approval gate が関係する作業は、Mission、Task、Report、Decision Log、PR description、issue のいずれかに戻す。

### Task Split

Parent Agent は Mission または plan を bounded task に分解する。

Task split の原則:

- 1 task は独立して検証できる単位にする。
- docs-only、code branch、DB read-only、approval package、notification review を混ぜない。
- 並列化する場合は、書き込み対象が重ならないようにする。
- 競合しやすい変更は同じ executor にまとめる。
- migration、secret、dashboard、production write の可能性が出たら、その task は approval gate へ切り出す。

### Execution

Execution は Writer Agent、DB Inspector Agent、QA Agent、Reviewer Agent、または optional external executor が担当する。

Execution の原則:

- 既存構造に沿った最小変更を行う。
- root cause に対処する。
- Bloomlog 固定用語を勝手に変更しない。
- docs-only safe path では `docs/` 配下の Markdown に限定する。
- code branch + PR path では branch / PR に差分を集約する。
- DB / migration path では read-only introspection までは AI が行い、write は Human approval まで止める。
- 他 Agent または Human の未コミット変更を revert しない。

### Validation

Validation は完了報告の前に行う。

Validation の例:

- `git status --short`
- `git diff --name-only`
- `git diff --stat`
- `git diff --check`
- lint
- test
- build
- browser verification
- read-only DB introspection
- PR diff review

実行できなかった validation は、理由、残リスク、次に必要な検証を Report または final report に残す。AI が実行できる検証を Human に戻さない。

### Review

Review は diff、仕様、運用境界、approval gate、検証結果を見る。

Review の優先観点:

- data loss。
- auth / RLS / policy / trigger / function / migration 影響。
- secret / token / raw notification body の保存。
- fixed term の変更。
- 過剰実装。
- app router、route、page、component の大量追加。
- notification inbox、ops dashboard、webhook、cron の未承認導入。
- validation 不足。

Claude Code の ultrareview 的な深いレビューは、Bloomlog では Reviewer Agent、QA Agent、PR review、必要に応じた parallel review task で実現する。ただし未承認の自動 reviewer fleet は作らない。

### Approval Gate

Human approval gate が必要な操作:

- 本番 DB write。
- destructive SQL。
- `npx supabase db push`。
- `npx supabase migration repair`。
- migration の本番適用。
- secret、token、API key、OAuth secret、環境変数の作成、更新、削除。
- Supabase / Vercel / GitHub などの dashboard 設定変更。
- 課金、ドメイン、認証 provider、redirect URL など実運用に影響する設定変更。
- production write。
- main merge。
- 外部通知をきっかけにしたコード変更、migration、dashboard 変更の実行判断。
- 大規模構造変更。

Approval gate 前に AI が準備するもの:

- 対象。
- 実行内容。
- 実行コマンドまたは SQL。
- diff。
- risk。
- rollback。
- unknowns。
- verification。
- approval 後に AI が実行する範囲。

Human は approval / rejection を行う。Human を Mission state 更新係、diff 確認係、SQL 実行係、転記係にしない。

### Commit / PR / Final Report

docs-only safe path では、条件を満たす場合に Parent Agent が diff 確認後、commit / push まで行える。

code branch + PR path では、AI は branch に差分を集約し、PR description、検証結果、残リスク、review findings を整理する。main merge は Human approval gate として扱う。

Final report には次を含める:

- 何を変えたか。
- なぜ必要か。
- どこまで変えたか。
- 何を変えていないか。
- 変更したファイル一覧。
- 実行した validation。
- 残リスク。
- pushed yes / no。
- Human が次に確認すべきこと。

## 4. Control Plane Artifacts

### `AGENTS.md`

`AGENTS.md` は repo operating contract である。Claude Code の `CLAUDE.md` 相当として扱い、作業入口、禁止事項、approval gate、用語固定、docs運用、Plan only ルールを定義する。

`AGENTS.md` は百科事典にしない。恒久ルールと境界を置き、詳細な task state や一時判断は Mission、Report、Decision Log、PR、issue に置く。

### `docs/product/`

Bloomlog の正式仕様を置く。対象は、体験価値、固定用語、ドメイン構造、採用済み技術方針、UI / data structure に影響する確定判断である。

固定用語:

- 来場日。
- 思い出。
- 思い出アルバム。
- タイムライン。
- 記録。

これらを英語化したり、独自に言い換えたりしない。

### `docs/ai-team/`

AI 運用、調査、レビュー、handoff、approval package、notification review、DB read-only introspection、Mission artifacts を置く。

`docs/ai-team/` は production canonical ではなく、AI 運用の canonical である。確定したプロダクト仕様は `docs/product/` に反映する。

### Mission / Task / Report / Decision Log

Mission は目的と成功条件の単位である。Task は実行可能な単位である。Report は実行結果と検証結果である。Decision Log は判断の記録である。

これらは hidden memory の代替であり、複数 Agent が同じ前提で作業するための repo artifact として扱う。

### Branch / PR / Issue

Branch は差分の実行単位である。PR は code branch + PR path の review / merge 判断の場所である。Issue は未着手 work item、承認待ち課題、将来 task の置き場である。

原則:

- main に直接実装しない。
- one task = one branch を基本とする。
- independent task は independent worktree / cloud task に分離する。
- PR には validation、risk、docs update の要否を残す。

### Validation Results

Validation result は完了判断の材料である。lint、test、build、browser verification、read-only introspection、diff review などの結果を Report、PR、final report に残す。

Validation が未実行の場合は `not-run` と理由を明記する。

## 5. Agent Roles

### Human

Human は approver、rejector、priority setter である。

担当すること:

- Mission の目的、優先順位、方針衝突の意思決定。
- 本番 DB write、destructive SQL、secret、dashboard、production write、main merge の approval / rejection。
- UI 文言、プロダクト方針、運用方針で複数案が残る場合の判断。

担当しないこと:

- AI が読めるファイルの転記。
- diff 確認。
- read-only SQL / CLI の代行。
- スクリーンショット係。
- 目視確認係。
- Agent 間通信路。
- Mission state 更新係。

### Sakura

Sakura は外部監査、方針レビュー、人間意図の翻訳者である。

担当すること:

- Bloomlog の体験価値と既存方針から外れていないかを見る。
- Human の意図、違和感、優先順位を Mission / Task / Decision Log に翻訳する。
- 固定用語が守られているか確認する。
- approval gate 前の判断材料に抜けがないか確認する。

Sakura は Human の代わりに最終承認しない。手作業担当にもならない。

### Parent Agent

Parent Agent は repo-first workflow の controller である。

担当すること:

- `AGENTS.md` と関連 docs を読み、scope と path を確認する。
- plan を作る。
- task split を行う。
- Writer / Reviewer / QA / DB Inspector / optional external executor の担当範囲を決める。
- 成果物を repo files、branch、PR、issue に集約する。
- approval gate 直前で停止し、risk、rollback、verification を整理する。
- final report と pushed yes / no を明記する。

### Writer Agent

Writer Agent は docs または code の変更を行う。

担当すること:

- 既存構造に沿った最小変更。
- docs-only safe path での docs 更新。
- code branch + PR path での実装と関連テスト。
- 変更理由、範囲、未変更範囲の整理。

Writer Agent は migration、webhook、cron、Gmail API、Apps Script、`service_role` / admin client、ops dashboard、notification inbox、route / page / component 大量追加、`package.json` 不要変更を未承認で行わない。

### Reviewer Agent

Reviewer Agent は diff と方針適合性を確認する。

担当すること:

- 仕様逸脱、過剰実装、用語変更、責務違反の検出。
- security、auth、RLS、secret、dashboard 影響の確認。
- approval gate 要否の確認。
- review findings を Report または PR に残す。

### QA Agent

QA Agent は検証設計と検証実行を担当する。

担当すること:

- lint、build、test、browser verification、read-only SQL、migration drift check の設計。
- AI が実行できる検証の実行。
- 未実行検証の理由と残リスクの記録。

### DB Inspector Agent

DB Inspector Agent は DB、RLS、policy、trigger、function、migration 差分の read-only 調査を担当する。

担当すること:

- repo migration を読む。
- remote DB の read-only introspection を行う。
- migration と実 DB の差分を整理する。
- `db push`、migration repair、個別 SQL 適用が必要な場合に approval package を作る。

Human approval 前に DB write、`db push`、migration repair、destructive SQL を実行しない。

### Optional External Executor

Claude Code、別 Codex session、cloud task、GitHub Action、SDK controller などの外部 executor は、repo canonical state を読ませた上で bounded task に限定して使う。

外部 executor の出力は、chat ではなく branch、PR、Report、Decision Log、issue に戻す。外部 executor を source of truth にしない。

## 6. Execution Paths

### docs-only safe path

`docs/` 配下の Markdown だけを変更する経路である。

Allowed:

- `docs/ai-team/**/*.md` の限定編集。
- `docs/product/**/*.md` の正式仕様更新。ただし確定判断のみ。
- `git status`、`git diff`、`git diff --check`。
- 条件を満たす場合の commit / push。

Prohibited:

- `app/`、`lib/`、`supabase/`、`migrations/`、`package.json`、`.env*` の変更。
- DB write。
- migration 作成。
- `db push`。
- migration repair。
- file deletion / archive move。ただし明示依頼がある場合を除く。

### code branch + PR path

アプリコードを変更する経路である。

Rules:

- 作業 branch を使う。
- `docs/product/` の正式仕様に従う。
- 既存 UI、routing、data structure、固定用語を優先する。
- 最小変更で root cause に対処する。
- lint / test / build / browser verification を必要に応じて行う。
- main merge は Human approval gate とする。

### DB / migration approval path

DB、RLS、policy、trigger、function、migration 履歴に関係する経路である。

Rules:

- read-only introspection は AI が行う。
- migration 案、SQL 案、rollback、verification を整理する。
- production DB write、destructive SQL、`db push`、migration repair、本番 migration 適用は Human approval 前に実行しない。
- approval 後に AI が実行できる構成を目指すが、secret や account owner 操作は Human の manual work として扱う。

### notification review path

外部通知は、取得、分析、承認、実行を分離する。

Rules:

- Gmail などの外部手段で取得する。
- sanitized summary だけを repo に残す。
- raw email body、secret、dashboard URL、project ID、内部 ID を保存しない。
- 対応不要は queue 内で完了できる。
- code change、migration、dashboard 変更候補は bounded Mission または approval package に切り出す。

### automation / cloud delegation path

Cloud task、scheduler、GitHub Action、external controller、hook、skill、plugin は将来拡張である。

Rules:

- v1 TO-BE では導入しない。
- 導入する場合は別 Mission と Human approval を必要とする。
- app automations と cloud background execution を混同しない。
- 常時運転を求める場合は、local app 稼働に依存しない構成を別途設計する。
- cost、stop condition、branch isolation、audit log を設計してから使う。

## 7. Guardrails

### Prohibited Actions

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
- destructive SQL。
- secret / dashboard 変更。
- archive 移動。
- file deletion。

### Approval Gates

Approval gate は「安全のために何もしない」ためのものではない。AI は gate 前に read-only 調査、diff 整理、risk、rollback、verification、実行候補を準備する。

Human approval が必要な操作だけを gate で止める。AI が実行できる調査や検証を Human に戻さない。

### Branch / Worktree Separation

並列実行では branch / worktree / cloud task を分離する。

- 1 task = 1 branch を基本とする。
- 独立作業は独立 worktree または cloud task に分ける。
- 同じファイルを複数 executor が同時に編集しない。
- Parent Agent が統合点を持つ。
- merge 前に review と validation を通す。

### No Hidden Memory As Source of Truth

memory、chat history、外部 AI の返答は source of truth ではない。重要な判断は repo artifact に戻す。

戻す先:

- `AGENTS.md`
- `docs/product/`
- `docs/ai-team/`
- Mission
- Task
- Report
- Decision Log
- PR description
- issue

### No Raw Notification Body Or Secret Persistence

通知レビュー、DB調査、dashboard調査では、次を repo に保存しない。

- raw email body。
- secret。
- token。
- API key。
- OAuth secret。
- dashboard URL。
- project ID。
- internal ID。
- billing detail。

必要な場合は、種類、必要理由、Human が操作すべき範囲だけを記録する。

### No Unapproved Swarm Expansion

Claude Code 的な agent teams / routines / ultrareview / channels / monitor に相当する構成は、Bloomlog では段階導入する。

未承認で行わないこと:

- 長寿命 external controller。
- autonomous swarm。
- scheduler 常時運転。
- GitHub Action による自動実装。
- hook による自動 write。
- dashboard / ops UI。
- notification inbox。

まず repo-first workflow を固め、その後に必要性が確認されたものだけを別 Mission で導入する。

## 8. Adoption Order

### Phase 1: TO-BE docs-only rebaseline

目的:

- この TO-BE を repo-first autonomous workflow として確定する。
- 旧 schema-first TO-BE を正本から外す。
- docs-only safe path で変更する。

完了条件:

- `docs/ai-team/ai-is-to-be-architecture.md` が新方針に置き換わっている。
- 変更範囲が docs-only である。
- `git diff --check` が通る。
- 旧 schema-first 思想が TO-BE の中心として残っていない。

### Phase 2: Existing operating docs alignment

目的:

- 必要に応じて `agent-operating-model.md`、`mission-lifecycle.md`、`agent-docs-map.md`、review workflow、communication protocol を新 TO-BE と矛盾しないよう調整する。

条件:

- 別 Mission または明示依頼で扱う。
- docs 乱立を避け、既存 docs の責務を優先する。
- archive / deletion は別判断とする。

### Phase 3: Optional templates / validation helpers

目的:

- Plan、Task、Report、Decision Log、approval package のテンプレートを必要最小限で整える。
- docs-only safe path、code branch + PR path、DB approval path の validation checklist を整える。

条件:

- 実運用で不足が確認された場合だけ行う。
- `package.json` や app code を不要に変更しない。
- hook、skill、plugin は別 approval を必要とする。

### Phase 4: Optional cloud / scheduler / controller design

目的:

- 長時間 task、parallel executor、cloud delegation、GitHub Action、external controller を設計する。

条件:

- 別 Mission と Human approval を必要とする。
- cost、security、sandbox、branch isolation、audit log、stop condition を先に定義する。
- production write や dashboard change を含む場合は approval gate を通す。
- local app automations を常時 cloud execution と誤認しない。

## 9. Migration From Current TO-BE

この rebaseline により、旧 TO-BE の中心だった次の考え方は正本から外す。

- Conversation Layer / Execution Layer の細かい二層モデルを中心にすること。
- strict Mission schema を最初の主成果物にすること。
- machine-readable state を v1 導入条件にすること。
- path enforcement tool を v1 導入条件にすること。
- Conversation AI の schema 生成可否を主要論点にすること。

ただし、次は維持する。

- 会話を正本にしない。
- Human は approver / rejector であり、手作業係ではない。
- AI は read-only introspection、diff、検証、rollback 案作成を行う。
- production write、DB、secret、dashboard、main merge は approval gate で止める。
- repo artifacts に最終状態を戻す。

新 TO-BE は、厳密な状態機械を先に作るのではなく、実際に回る repo-first autonomous workflow を先に正本化する。そのうえで、必要になった schema、state json、hook、skill、plugin、controller を段階導入する。
