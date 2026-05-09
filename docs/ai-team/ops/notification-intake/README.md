# Notification Intake Ops

作成日: 2026-05-09

## 入口

Codex は通知 intake job を実行するとき、次を読む。

1. `AGENTS.md`
2. `docs/ai-team/mission-lifecycle.md`
3. `docs/ai-team/ops/notification-intake/README.md`
4. `docs/ai-team/ops/notification-intake/queue.md`

短い実行指示:

```text
AGENTS.md と docs/ai-team/ops/notification-intake/README.md を読んで、queue.md の pending を処理してください。
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
- secret、token、dashboard URL、project ID、内部 ID、請求詳細を保存しない。
- `template.md` に従って sanitized entry を作る。
- 初期分類、重要度、Bloomlog への影響候補を付ける。

### Codex

- `queue.md` の pending entry を読む。
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
- dashboard / secret / production setting 変更候補がある。
- `db push`、migration repair、production DB write、destructive SQL の可能性がある。
- 複数 entry を横断して判断する必要がある。
- rollback / verification / approval package が必要。

Queue 内で完了してよい:

- newsletter。
- historical resolved。
- low severity の情報通知。
- Bloomlog への影響がない通知。
- repo 現状と照合して追加対応不要と判断できる通知。

## Codex の処理手順

1. `git status --short` を確認する。
2. `queue.md` の `pending` を読む。
3. raw body、secret、token、dashboard URL、project ID が混入していないか確認する。
4. entry ごとに repo / docs / migrations / config を read-only で照合する。
5. action_class と approval gate 要否を更新する。
6. queue 内完了、follow-up Mission、approval-needed candidate のどれかに進める。
7. `runs/` に実行ログを残す。
8. docs-only safe path の場合は diff を確認して commit / push する。

## Reviewer / QA 観点

Reviewer は次を見る。

- raw email body や secret が保存されていない。
- Human が転記係、diff 確認係、dashboard 目視係に戻されていない。
- Ops と Mission の境界が守られている。
- approval gate 対象が queue 内で実行扱いになっていない。
- app / lib / supabase / migrations / package / env が変更されていない。

QA は次を見る。

- `git status --short`、`git diff --name-only`、`git diff --stat` が確認されている。
- docs-only safe path が yes / no で記録されている。
- queue status と run log が整合している。
- follow-up Mission が必要な entry は queue 内で完了扱いになっていない。

## 禁止事項

- Gmail API、Apps Script、webhook、cron を追加しない。
- Bloomlog app 本体に Gmail 連携を組み込まない。
- notification inbox、ops dashboard を作らない。
- メール本文やセキュリティ通知を DB に保存しない。
- Human approval 前に code change、migration、DB write、dashboard 変更、secret 変更へ進まない。
