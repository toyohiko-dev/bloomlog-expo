# Bloomlog AI-IS Current State

> Historical note: この文書は AI Team experiment era の状態整理であり、通常の Codex 開発の正本ではない。
> 現在の通常開発では root `AGENTS.md`、domain `AGENTS.md`、`docs/product/` を優先する。

作成日: 2026-05-10

## 1. Purpose

このドキュメントは、Bloomlog における現在の AI-IS（AI Integration System / AI Team Operating System）の実運用状態を AS-IS として固定する。

AI-IS は、Bloomlog の開発・運用判断を AI が作業し、Human が承認するための repo-driven operating system として使われている。Bloomlog はイベント体験を「来場日」単位で記録し、「思い出」として振り返るアプリであり、AI operated development は `docs/product/` の正式仕様、`AGENTS.md`、`docs/ai-team/` の運用 docs に従って行われる。

この文書は現状記録であり、改善提案、TO-BE 設計、Skill 化、Plugin 化、MCP 設計、agent-os/ 新構造追加、state json 化、Path abstraction 改善は扱わない。

## 2. Core Principles

- AI は作業者であり、Human は承認者である。
- Human を通信路、スクリーンショット係、目視確認係、転記係、diff 確認係にしない。
- Agent 間共有はチャットではなく、repo files、branch、PR、issue に寄せる。
- `docs/product/` は正式仕様、`docs/ai-team/` は AI 運用、分析、レビュー、handoff、承認前の判断材料の置き場である。
- 本番 DB write、destructive SQL、secret 変更、dashboard 設定変更、production write、main merge は approval gate で止める。
- AI が可能な read-only introspection、diff 確認、検証、rollback 案作成は AI が行う。
- 外部通知、DB 調査、実装、レビューは混ぜず、取得、分析、承認、実行を分離する。
- Mission state の正本は `docs/ai-team/mission-lifecycle.md` と各 `mission.md` の状態フィールドである。

## 3. Roles

### Human

Responsibility:

- Mission の目的と優先順位を承認する。
- gated operation を承認または却下する。
- UI 文言、プロダクト方針、運用方針で複数案が残る場合に意思決定する。
- PR の merge 可否を判断する。

Authority:

- 本番 DB write、destructive SQL、secret 変更、dashboard 設定変更、production execution、main merge の approval / rejection。

Prohibited actions / non-responsibilities:

- AI が読めるファイルの転記係にならない。
- AI が実行できる read-only SQL、CLI、diff 確認、スクリーンショット取得、目視確認を恒常的に代行しない。
- Mission state の手動更新係にならない。
- Agent 間の連絡係にならない。

### Sakura

Responsibility:

- 外部監査、方針レビュー、人間意図の翻訳を行う。
- AI の提案や実装方針が Bloomlog の体験価値と既存方針から外れていないか監査する。
- Human の意図、違和感、優先順位を Mission / Task / Decision Log に翻訳する。
- 「来場日」「思い出」「思い出アルバム」「タイムライン」「記録」などの固定用語をレビューする。
- notification intake では Gmail read-only intake から sanitized entry を作る役割を持つ。

Authority:

- 方針レビュー、人間意図の翻訳、監査観点の提供。
- Sakura review feedback は decision-log、PR / issue comment、または Parent への feedback として扱われる。

Prohibited actions:

- 手作業担当にならない。
- 本番操作の実行者にならない。
- Human の代わりに最終承認を行わない。
- Agent 間通信路にならない。
- raw email body、認証情報、dashboard URL、project ID、内部 ID を保存しない。

### Parent Agent

Responsibility:

- Mission 全体を統括する。
- `AGENTS.md`、`docs/product/`、関連 `docs/ai-team/` を読み、scope と path を確認する。
- Mission を Task に分解する。
- Writer / Reviewer / QA / DB Inspector の担当範囲を決める。
- Agent 間の成果物を repo files、branch、PR、issue に集約する。
- approval gate が必要な操作の直前で停止し、対象、影響、リスク、rollback 案をまとめる。
- `mission.md` の最終状態、Decision Log、Parent Summary を整理する。
- docs-only safe path の条件を満たす場合は diff 確認後に commit / push する。

Authority:

- integration / execution summary 後に `mission.md` の状態を更新できる。
- Mission finalization の記録責任を持つ。

Prohibited actions:

- Human approval 前に gated operation を executing にしない。
- 状態管理のためだけに app code、Supabase migration、production SQL、`db push`、migration repair を実行しない。
- docs-only safe path で app / lib / supabase / migrations / package / `.env*` を変更しない。

### Writer Agent

Responsibility:

- Task に沿って実装または docs 作成を行う。
- 既存構造に沿って最小変更を行う。
- UI 文言、用語、routing、データ構造を勝手に変更しない。
- docs-only safe path では `docs/` 配下に限定して変更する。
- code branch + PR path では実装、関連テスト、必要な docs 更新を行う。

Authority:

- task / report を更新できる。
- 承認済みスコープ内の通常コード編集または docs 編集を行える。

Prohibited actions:

- Mission 状態を直接変更しない。
- migration が必要になりうる場合は、実装前に Parent Agent と DB Inspector Agent へ戻す。
- 明示依頼または承認なしに migration、webhook、cron、Gmail API、Apps Script、`service_role` / admin client、ops dashboard、notification inbox、app router、route / page / component 大量追加、`package.json` 不要変更を行わない。

### Reviewer Agent

Responsibility:

- diff と Report を読み、仕様逸脱、過剰実装、用語変更、責務違反を確認する。
- 既存構造を壊していないか確認する。
- セキュリティ、RLS、認証、secret、dashboard 影響の有無を確認する。
- docs-only safe path 条件と approval gate 要否を確認する。

Authority:

- findings と approval gate 判定を report に書く。

Prohibited actions:

- Mission 状態を直接変更しない。
- Human の代わりに approval / rejection を行わない。

### QA Agent

Responsibility:

- lint、build、unit test、UI 確認、read-only SQL、migration drift check などの検証を設計する。
- AI が実行できる検証を実行する。
- 実行できなかった検証は理由、残リスク、次に必要な検証を Report に残す。

Authority:

- validation 結果と residual risk を report に書く。

Prohibited actions:

- Mission 状態を直接変更しない。
- 実行できる検証を Human に戻さない。

### DB Inspector Agent

Responsibility:

- DB、RLS、policy、trigger、function、migration 差分の read-only 調査を行う。
- repo の `supabase/migrations/` を読む。
- remote DB の schema、RLS、policy、trigger、function、migration 履歴を read-only で確認する。
- migration と実 DB の差分を整理する。
- `db push`、`migration repair`、個別 SQL 適用が必要な場合は、対象、影響、想定リスク、rollback 方針をまとめる。

Authority:

- read-only 調査、approval-needed 判定、rollback 案を report に書く。

Prohibited actions:

- Human approval 前に DB write、`db push`、`migration repair`、destructive SQL を実行しない。
- Mission 状態を直接変更しない。

## 4. Mission Lifecycle

Mission state は各 `mission.md` の YAML-like fields で管理される。

Status definitions:

| status | AS-IS definition |
| --- | --- |
| `proposed` | Mission 案はあるが、scope / path / owner がまだ確定していない。 |
| `active` | Mission が確定し、Agent が task / review / docs-only 作業を進めている。 |
| `approval-needed` | production write、main merge、secret、dashboard、migration repair、`db push` など gated operation の Human 判断待ち。 |
| `executing` | 承認済みまたは approval 不要の操作を Agent が実行中。 |
| `verification-partial` | core execution は通ったが、runtime / browser / app smoke など一部検証が環境制約で未完了。 |
| `completed` | 必要な実行と検証が完了し、残リスクがない、または残リスクを別 follow-up に分離済み。 |
| `blocked` | 正確な blocker と unblock 条件があるため進めない。 |
| `superseded` | 新しい Mission、PR、package、方針がこの Mission を置き換えた。 |

State transitions:

- `proposed -> active`: Parent が scope、path type、owner、next action を確定したとき。
- `active -> approval-needed`: Human approval gate が必要な操作を特定し、approval package が準備できたとき。
- `approval-needed -> executing`: Human approval が記録された後のみ。
- `approval-needed -> blocked`: Human が却下した、または approval package に正確な blocker が見つかったとき。
- `executing -> completed`: 承認済み操作または approval 不要操作が完了し、必要な verification が pass したとき。
- `executing -> verification-partial`: core execution は pass したが、runtime / browser / app smoke verification が環境制約で利用できないとき。
- `verification-partial -> completed`: residual risk が記録され、未完了検証または rollback 判断が別 follow-up task / issue / Mission に分離されたとき。
- `any state -> blocked`: 正確な blocker と必要な unblock condition が書けるときだけ。
- `any state -> superseded`: 新しい Mission、PR、approval package、方針が置き換え先として明示されたとき。

Finalization duties:

- Parent Agent が `mission.md` の状態フィールドを更新する。
- Parent Agent が `decision-log.md` に状態遷移、承認結果、選択 option、残リスクを記録する。
- Parent Agent が `reports/parent-summary.md` を更新または作成する。
- execution が発生した場合は `reports/execution-report.md` を更新または作成する。
- docs-only safe path の条件を満たす場合は commit / push する。
- 最終報告で pushed yes / no を明記する。

## 5. Path Types

### docs-only safe path

`docs/` 配下の Markdown だけを変更する経路である。

Conditions:

- `app/`、`lib/`、`supabase/`、`migrations/`、`package.json`、`.env*` を変更しない。
- DB write、migration repair、`db push` を行わない。
- 既存 MD の大幅改修、削除、archive 移動は依頼がある場合だけ行う。
- 新規 docs を作る場合も、正式仕様と作業領域の区別を守る。
- diff 確認後、条件を満たす場合は作業 branch へ commit / push してよい。

### code branch + PR path

アプリコードを変更する経路である。

Conditions:

- 事前に Mission と scope を確認する。
- `docs/product/` の正式仕様に従う。
- 既存構造、既存 UI、既存用語を優先する。
- 最小変更で root cause に対処する。
- migration、secret、dashboard 影響がある場合は approval gate に入る。
- main merge は Human approval gate で扱う。

### DB / migration path

DB、RLS、policy、trigger、function、migration 履歴に影響する可能性がある経路である。

AS-IS 手順:

- DB Inspector Agent が read-only introspection を行う。
- repo migration と remote DB / migration 履歴の差分を整理する。
- migration generation の必要性、repair candidate、rollback plan を整理する。
- migration apply、migration repair、`db push`、destructive SQL、production DB write は Human approval gate に入る。
- Human approval 後にのみ production execution に進む。

## 6. Approval Gates

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

Gate 前に AI が準備するもの:

- 対象。
- 実行内容。
- 実行コマンドまたは SQL。
- diff。
- risk。
- rollback。
- unknowns。
- verification。
- approval 後に AI が実行する範囲。

## 7. Queue System

Notification Intake Queue は `docs/ai-team/ops/notification-intake/queue.md` を正本としている。

入口:

- Codex は notification intake job 実行時に `AGENTS.md`、`docs/ai-team/mission-lifecycle.md`、`docs/ai-team/ops/notification-intake/README.md`、`docs/ai-team/ops/notification-intake/queue.md` を読む。

Sanitized intake:

- Sakura / ChatGPT は Gmail read-only intake から raw body を保存しない sanitized entry を作る。
- raw email body、認証情報、dashboard URL、project ID、内部 ID は保存しない。
- entry は `dispatch` metadata を持ち、Codex が長文チャットなしで次 action を判定する。

Queue statuses:

- `pending`: Sakura / ChatGPT が sanitized entry を作成し、Codex の処理待ち。
- `triaged`: Codex が repo と照合し、次の扱いを決めた。
- `completed`: queue 内で完了。
- `follow-up-created`: bounded Mission、PR、または issue に切り出した。
- `approval-needed-candidate`: gated operation の可能性があり、approval package 作成前または作成中。
- `blocked`: 正確な blocker と unblock 条件がある。

Queue -> Mission flow:

- DB / RLS / policy / trigger / function / migration 履歴の read-only 照合が必要な場合は Mission に切り出す。
- code change 候補、dashboard / credential / production setting 変更候補、`db push`、migration repair、production DB write、destructive SQL の可能性がある場合は Mission または approval package に進む。
- `dispatch.mission_required` が `yes` の場合は bounded follow-up Mission に切り出す。
- queue-only で完了できるものは queue 内で `completed` に進める。

Current queue reality:

- `Pending` は「なし」。
- `Triaged` には NTF-20260509-02、NTF-20260509-03 がある。
- `Completed` には NTF-20260509-04 がある。
- `Follow-up Created` には NTF-20260509-01 があり、`docs/ai-team/missions/mission-20260509-notification-rls-check/` に切り出されている。
- `Approval Needed Candidates` は「まだなし」。

## 8. Repository Coordination

AS-IS の通信媒体:

| medium | current use |
| --- | --- |
| repo files | Mission、Task、Report、Decision Log、調査結果、handoff、運用ルールを置く。 |
| branch | 作業単位の commit 履歴、差分、docs-only 共有状態を持つ。 |
| PR | code branch + PR path の変更内容、review、QA、merge 判断を置く。 |
| issue | 未着手 Mission、承認待ち課題、外部通知レビュー、将来 Task を管理する場所として定義されている。 |
| chat | 作業中の短い進捗、最終報告、起動補助に留める。 |

Branch / reconcile / main の現在構造:

- `main`: production canonical branch。現時点の `origin/main` は `035b35b docs: formalize AI agent operation principles and RLS remediation handoff`。
- `chore/ai-team-state`: AI Team / Agent OS docs を整理する作業 branch。local は `42a708d` で、`origin/chore/ai-team-state` は `6b3e627`。local branch は origin より 3 commits behind と表示されている。
- `chore/ai-team-state-codex-reconcile`: 現在作業中の reconcile branch。`00dac22 docs: complete notification rls read-only check` で `origin/chore/ai-team-state-codex-reconcile` と一致している。

Commit / push / merge 運用:

- docs-only safe path では条件確認後に AI が commit / push する。
- code changes は branch + PR に集約する。
- main merge は Human approval gate で扱う。
- final report では pushed yes / no を明記する。

Repo-driven state management:

- Mission state は repo files に記録する。
- Agent 間成果物は branch / PR / issue / repo files に残す。
- Human や Sakura のチャット補足は正本ではなく、最終状態は repo / GitHub に残す。

## 9. Current Problems / Known Limitations

以下は現状として確認できる制約であり、改善案ではない。

- `main` と `chore/ai-team-state*` の間に差分があり、AI-IS docs の多くはまだ `main` に統合されていない。
- local `chore/ai-team-state` は `origin/chore/ai-team-state` より 3 commits behind であり、同名 branch の local / remote に状態差がある。
- 現在作業中の `chore/ai-team-state-codex-reconcile` は reconcile branch として、`chore/ai-team-state` に加えて notification RLS follow-up Mission と queue reconcile を含む。
- Mission directory は `docs/ai-team/missions/<mission-id>/` の flat 配置が有効で、`active/`、`completed/` などの状態別 directory は推奨構造として記載されているが、既存 Mission は移動されていない。
- docs が複数存在し、AGENTS、operating model、review workflow、communication protocol、mission lifecycle、docs map、notification intake docs に役割が分散している。
- Path abstraction は docs 内の path type として運用されており、機械的な path enforcement は repo 上の docs と diff 確認に依存している。
- chat は補助に留める方針だが、現実には Mission 起動や最終報告でチャット補足が使われる。
- Skill / Plugin / MCP 統合は現行 AI-IS の正本構造には入っていない。
- machine-readable state は `mission.md` の YAML-like fields と Markdown queue に留まり、専用 state json は存在しない。
- `verification-partial` は失敗ではなく、環境制約で未完了検証がある場合の運用状態として使われている。
- Notification Intake は sanitized summary に依存するため、raw email body や dashboard-specific target は repo に保存されない。

## 10. Current Operational Reality

現在の AI-IS は、理想設計だけではなく、以下の形で実際に回っている。

- 作業入口は `AGENTS.md` であり、AI Team / Agent OS 作業では最初に読む対象として扱われる。
- Mission lifecycle の正本は `docs/ai-team/mission-lifecycle.md` である。
- docs 配置と寿命の supporting reference は `docs/ai-team/agent-docs-map.md` である。
- 役割と approval boundary は `docs/ai-team/agent-operating-model.md`、review / approval flow は `docs/ai-team/agent-review-workflow.md`、Agent 間通信は `docs/ai-team/agent-communication-protocol.md` に記録されている。
- Notification Intake の正本入口は `docs/ai-team/ops/notification-intake/README.md` と `queue.md` である。
- queue から DB read-only follow-up Mission へ切り出された実例として `mission-20260509-notification-rls-check` が存在する。
- DB / migration 関連では read-only introspection、approval-needed 判定、rollback 案整理が DB Inspector Agent の責務として記録されている。
- approval-needed structure は Mission directory 内の `approval-needed.md` として存在し、`mission-20260509-operational-rebaseline` と `mission-20260509-supabase-migration-history` に実例がある。
- report structure は `reports/parent-summary.md`、`reports/reviewer-report.md`、`reports/qa-report.md`、`reports/db-inspector-report.md`、`reports/execution-report.md` などとして運用されている。
- decision-log structure は各 Mission directory の `decision-log.md` として運用されている。
- docs-only safe path では AI が git status、diff、docs-only 確認を行い、commit / push まで行う前提で運用されている。
- Human approval boundary は、本番 DB write、destructive SQL、secret、dashboard、production write、main merge などに限定されている。
