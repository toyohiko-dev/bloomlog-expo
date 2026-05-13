# Notification Intake Ops

> Historical note: この directory は AI Team experiment era の notification intake 運用資料であり、通常の Codex 開発の正本ではない。
> 通常開発ではこの queue / Mission 運用を入口にしない。

作成日: 2026-05-09

## 入口

この directory は notification intake の正本入口である。Codex は通知 intake job を実行するとき、次を読む。

1. `AGENTS.md`
2. `docs/ai-team/mission-lifecycle.md`
3. `docs/ai-team/ops/notification-intake/README.md`
4. `docs/ai-team/ops/notification-intake/queue.md`

## Standard trigger

Human / Sakura は原則として次の短い指示だけでよい。

```text
notification intake queue を処理してください。
```

Codex はこの短い指示を受けたら、次の標準指示として解釈する。

```text
AGENTS.md と docs/ai-team/ops/notification-intake/README.md を読んで、queue.md の pending を処理してください。
```

より明示したい場合だけ、次を使う。

```text
AGENTS.md と docs/ai-team/ops/notification-intake/README.md を読んで、queue.md の pending を処理してください。docs-only safe path の場合は commit / push まで実行し、pushed yes/no を報告してください。
```

## 位置づけ

Notification intake は一回限りの開発 Mission ではなく、継続的に回す AI ops job として扱う。

- Ops: 継続的な検知、取得、分類、キュー管理を行う。
- Mission: Ops の中で発生した bounded 対応案件を扱う。

前回の設計 Mission `mission-20260509-notification-intake-workflow` は、初期 workflow を定義した completed Mission として保持する。今後の正本入口はこの ops directory とする。

## 役割

### Sakura / ChatGPT

- Gmail を read-only で確認する。
- raw email body を保存しない。
- 認証情報、dashboard URL、project ID、内部 ID、請求詳細を保存しない。
- `template.md` に従って sanitized entry を作る。
- 初期分類、重要度、Bloomlog への影響候補を付ける。
- `dispatch` を付け、Codex が長文チャットなしで次 action を判定できるようにする。

### Codex

- `queue.md` の pending entry を読む。
- entry の `dispatch` を最初に読む。
- repo 状態、docs、migrations、config を read-only で照合する。
- queue entry を triaged / completed / follow-up-created / approval-needed-candidate に進める。
- 必要なら bounded follow-up Mission を切る。
- Reviewer / QA 観点で diff と approval gate を確認する。
- decision-log、parent-summary、approval-needed 案を作る。
- docs-only safe path なら commit / push する。

### Human

- workflow を起動する。
- gated operation の approval / rejection だけを行う。
- メール本文転記係、diff 確認係、dashboard 目視係にはならない。

## Queue 状態

| status | 意味 |
| --- | --- |
| `pending` | Sakura / ChatGPT が sanitized entry を作成し、Codex の処理待ち。 |
| `triaged` | Codex が repo と照合し、次の扱いを決めた。 |
| `completed` | queue 内で完了。対応不要、historical resolved、newsletter など。 |
| `follow-up-created` | bounded Mission、PR、または issue に切り出した。 |
| `approval-needed-candidate` | gated operation の可能性があり、approval package 作成前または作成中。 |
| `blocked` | 正確な blocker と unblock 条件がある。 |

`blocked` は不安な停止には使わない。Codex が read-only で調べられることは先に調べる。

## Dispatch metadata

各 queue entry は `dispatch` を持つ。Codex は `dispatch` を優先して次 action を判断する。

| field | 意味 |
| --- | --- |
| `recommended_flow` | `queue-only` / `docs-record` / `db-inspector-followup` / `code-followup` / `security-hygiene-followup` / `approval-package` |
| `execution_mode` | `docs-only` / `read-only-introspection` / `approval-gated-write` |
| `mission_required` | `yes` / `no` |
| `approval_gate_expected` | `yes` / `no` / `unknown` |
| `human_role` | `trigger-only` / `approval-rejection-only` |
| `codex_autonomy` | Codex が自律的に行う範囲 |
| `stop_condition` | Codex が停止すべき条件 |

`dispatch` は Human の長文指示を減らすための metadata である。`dispatch` がある entry では、Codex はチャットで追加確認せず、repo 上の指示に従って bounded action を実行する。

## Action class

| action_class | queue 内での扱い |
| --- | --- |
| 対応不要 | 根拠を短く残して `completed`。 |
| docs記録 | `runs/` または関連 docs に sanitized summary を残し、必要に応じて `completed`。 |
| code変更候補 | 別 Mission または PR に切り出す。 |
| DB対応候補 | read-only DB Inspector follow-up Mission に切り出す。 |
| dashboard変更候補 | approval gate 用の判断材料を作る。 |
| Human approval needed | `approval-needed.md` 案を作成して停止する。 |

## Ops から Mission へ切り出す条件

Mission に切り出す:

- DB / RLS / policy / trigger / function / migration 履歴の read-only 照合が必要。
- code change 候補がある。
- dashboard / credential / production setting 変更候補がある。
- `db push`、migration repair、production DB write、destructive SQL の可能性がある。
- 複数 entry を横断して判断する必要がある。
- rollback / verification / approval package が必要。
- `dispatch.mission_required` が `yes` である。

Queue 内で完了してよい:

- newsletter。
- historical resolved。
- low severity の情報通知。
- Bloomlog への影響がない通知。
- repo 現状と照合して追加対応不要と判断できる通知。
- `dispatch.recommended_flow` が `queue-only` で、追加調査不要と判断できる通知。

## Codex の処理手順

1. `git status --short` を確認する。
2. `queue.md` の `pending` を読む。
3. entry の `dispatch` を読む。
4. raw body、認証情報、dashboard URL、project ID が混入していないか確認する。
5. entry ごとに repo / docs / migrations / config を read-only で照合する。
6. `dispatch.recommended_flow`、action_class、approval gate 要否を照合して次 action を決める。
7. queue 内完了、follow-up Mission、approval-needed candidate のどれかに進める。
8. `runs/` に実行ログを残す。
9. docs-only safe path の場合は diff を確認して commit / push する。

## Reviewer / QA 観点

Reviewer は次を見る。

- raw email body や認証情報が保存されていない。
- Human が転記係、diff 確認係、dashboard 目視係に戻されていない。
- Ops と Mission の境界が守られている。
- approval gate 対象が queue 内で実行扱いになっていない。
- app / lib / supabase / migrations / package / env が変更されていない。
- `dispatch` と実際の処理が矛盾していない。

QA は次を見る。

- `git status --short`、`git diff --name-only`、`git diff --stat` が確認されている。
- docs-only safe path が yes / no で記録されている。
- queue status と run log が整合している。
- follow-up Mission が必要な entry は queue 内で完了扱いになっていない。
- `dispatch.mission_required` と follow-up の有無が整合している。

## 禁止事項

- Gmail API、Apps Script、webhook、cron を追加しない。
- Bloomlog app 本体に Gmail 連携を組み込まない。
- notification inbox、ops dashboard を作らない。
- メール本文やセキュリティ通知を DB に保存しない。
- Human approval 前に code change、migration、DB write、dashboard 変更、credential 変更へ進まない。
