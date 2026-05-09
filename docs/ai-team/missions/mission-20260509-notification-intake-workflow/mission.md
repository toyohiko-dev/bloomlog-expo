# Mission: Gmail Notification Intake Workflow

作成日: 2026-05-09

```yaml
status: completed
owner_role: Parent Agent
current_phase: finalization
selected_option: docs-only workflow design with approval gates
approval_required: no
approval_status: not-required
execution_status: completed
verification_status: passed
residual_risk: actual Gmail connector behavior and provider-specific notification patterns are not validated in this Mission
next_action: Run one bounded read-only pilot against recent Supabase Gmail notifications and record sanitized results in notification-review-log.md
last_updated: 2026-05-09
```

## 目的

Gmail に届く Supabase 通知を起点に、AI が通知を取得、分類、分析し、repo / docs / migrations / config と照合して対応要否を判断する運用 workflow を設計する。

将来 Vercel / GitHub 通知へ拡張できるよう、取得、分析、承認、実行を分離し、Bloomlog app 本体には Gmail 連携、webhook、cron、notification inbox、ops dashboard を組み込まない。

## 背景

既存 docs では外部通知レビューを取得、分析、承認の 3 層に分離し、通知本文全文や secret を保存しない方針が定義されている。

一方で、Gmail の Supabase 通知を AI が起点として扱い、repo の現状と照合して「対応不要」「docs記録」「code変更候補」「DB対応候補」「dashboard変更候補」「Human approval needed」に分類する具体的な Mission / Task / Report 単位の workflow は未定義である。

## 成功条件

- Gmail の Supabase 通知を起点にした intake workflow が定義されている。
- Vercel / GitHub 通知にも拡張できる provider-neutral な分類軸がある。
- メール本文全文、secret、token、請求情報、内部 ID を docs に保存しないルールが明記されている。
- AI が repo / docs / migrations / config と照合する read-only 手順が定義されている。
- 対応分類が次の 6 種に整理されている。
  - 対応不要
  - docs記録
  - code変更候補
  - DB対応候補
  - dashboard変更候補
  - Human approval needed
- 本番 write、secret、dashboard、db push、migration repair は Human approval gate で止まる。
- docs-only safe path の条件を満たし、commit / push できる状態になっている。

## 変更範囲

- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/` 配下の Mission artifacts のみを作成する。

## 非目的

- Gmail API、Apps Script、webhook、cron を作らない。
- Bloomlog app 本体に Gmail 連携を組み込まない。
- notification inbox、ops dashboard、route、page、component を追加しない。
- code、lib、Supabase migration、package、env を変更しない。
- 実際の Gmail 通知取得、実メール分析、DB write、dashboard 変更は行わない。

## path type

- docs-only safe path

## required agents

- Parent Agent
- Writer Agent
- Reviewer Agent
- QA Agent

## approval gates

- approval required: no
- approval type: none
- approval reason: この Mission は docs-only workflow 設計であり、本番 write、DB write、secret、dashboard、migration repair、db push を含まないため。

Human approval が必要になる条件:

- 実 Gmail 連携を新しく有効化する。
- Gmail API、Apps Script、webhook、cron を導入する。
- Bloomlog app 本体へ通知処理を組み込む。
- 通知を起点に code change、migration、DB write、dashboard 変更、secret 変更、db push、migration repair を実行する。
- メール本文全文や secret を保存する必要があると判断された場合。

## target branch

`chore/ai-team-state`

## output locations

- mission: `docs/ai-team/missions/mission-20260509-notification-intake-workflow/mission.md`
- tasks: `docs/ai-team/missions/mission-20260509-notification-intake-workflow/tasks/`
- reports: `docs/ai-team/missions/mission-20260509-notification-intake-workflow/reports/`
- decision log: `docs/ai-team/missions/mission-20260509-notification-intake-workflow/decision-log.md`
- approval-needed: none
- branch: `chore/ai-team-state`
- PR: none
- issue: none

## Workflow

### 1. Intake

AI は利用可能な Gmail 連携または Gmail 検索から、対象通知候補を read-only で取得する。

初期対象:

- Supabase

拡張対象:

- Vercel
- GitHub
- その他 Bloomlog 運用に関係する外部サービス

取得時に保存してよい情報:

- 受信日
- provider
- 通知種別の短い要約
- 重要度の仮分類
- Bloomlog との関連可能性
- 参照に必要な最小限のメタ情報

保存しない情報:

- メール本文全文
- secret / token / API key / OAuth secret
- magic link / password reset link
- 請求明細の詳細
- 個人情報
- 内部 ID や URL のうち、判断に不要なもの

### 2. Normalize

通知を provider-neutral な形に変換する。

標準項目:

| field | 内容 |
| --- | --- |
| provider | Supabase / Vercel / GitHub / other |
| notification_type | auth / db / migration / deploy / domain / billing / security / quota / policy / unknown |
| severity | high / medium / low / unknown |
| confidence | high / medium / low |
| affected_area | auth / deploy / DB / env / billing / domain / GitHub運用 / docs / unknown |
| due_date | 期限がある場合のみ、日付で記録 |
| action_class | 対応不要 / docs記録 / code変更候補 / DB対応候補 / dashboard変更候補 / Human approval needed |
| evidence_summary | 本文全文ではなく、判断に必要な要約 |
| repo_check_targets | 照合対象ファイルまたは領域 |
| approval_gate | none / code / DB / dashboard / secret / production write / main merge |

### 3. Classify

AI は通知を次の action class に分類する。

| action class | 定義 | 次の扱い |
| --- | --- | --- |
| 対応不要 | Bloomlog への影響がない、または情報通知のみ | `notification-review-log.md` へ最小記録するか、記録不要理由を Report に残す |
| docs記録 | 運用判断として残す価値があるが実装不要 | `docs/ai-team/notification-review-log.md` または Mission report に要約を追記する |
| code変更候補 | app / lib / config / tests の変更が必要な可能性 | Human / Sakura の承認後に別 Mission または code branch + PR path へ切り出す |
| DB対応候補 | migration、RLS、policy、trigger、function、migration history、db push、repair の可能性 | DB Inspector Agent の read-only 調査 Mission へ切り出し、write は approval gate で止める |
| dashboard変更候補 | Supabase / Vercel / GitHub dashboard 設定変更の可能性 | secret / dashboard approval gate 用の判断材料を作る |
| Human approval needed | 本番 write、secret、dashboard、db push、migration repair、destructive SQL、main merge など gate 対象 | `approval-needed.md` 案を作り、承認前に停止する |

### 4. Repo照合

分類後、AI は read-only で repo 状態と照合する。

Supabase 通知で見る対象:

- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/supabase-db-introspection.md`
- `docs/ai-team/notification-review-policy.md`
- `docs/ai-team/notification-review-status.md`
- `docs/ai-team/notification-review-log.md`
- `supabase/config.toml`
- `supabase/migrations/`
- `app/` と `lib/` の Supabase Auth / client 利用箇所
- `.env*` は値を読まず、必要なキー種別の存在要否だけを扱う

Vercel 通知で見る対象:

- `docs/product/dev.md`
- `next.config.ts`
- `package.json`
- deployment / domain / env に関係しそうな docs

GitHub 通知で見る対象:

- `AGENTS.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-review-workflow.md`
- branch / PR / issue の運用 docs
- security advisory に関係する dependency manifest

照合コマンド例:

```powershell
git status --short
rg "Supabase|supabase|Vercel|GitHub|OAuth|migration|db push|repair" docs app lib supabase
Get-ChildItem supabase\migrations | Sort-Object Name | Select-Object Name
git diff --name-only
git diff --stat
```

DB の現状確認が必要な場合は DB Inspector Agent の read-only introspection に切り出す。DB write、`db push`、`migration repair` は行わない。

### 5. Decision package

AI は通知ごとに次をまとめる。

- sanitized summary
- action class
- repo / docs / migrations / config 照合結果
- approval gate の要否
- 対応しない場合の影響
- 次の bounded action

保存先:

- 単発軽量レビュー: `docs/ai-team/notification-review-log.md`
- 複数通知または判断が重いレビュー: 新規 Mission
- 実装候補: 別 Mission または PR
- 本番操作候補: `approval-needed.md` 案

### 6. Approval gate

次は必ず Human approval gate で止める。

- 本番 DB write
- destructive SQL
- migration apply
- `db push`
- `migration repair`
- secret / token / env 変更
- Supabase / Vercel / GitHub dashboard 変更
- production setting 変更
- billing / domain / auth provider / redirect URL 変更
- main merge

approval gate 前に AI が用意するもの:

- 対象
- exact command / SQL / setting
- 影響範囲
- risk
- rollback
- verification
- unknowns

## Prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human に Agent 間通信の転記を依頼しない。
- Gmail 連携を Bloomlog app 本体に組み込まない。
- 承認前に実装、migration、DB write、dashboard 変更へ進まない。
