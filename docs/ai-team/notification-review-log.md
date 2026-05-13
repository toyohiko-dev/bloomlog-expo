# 外部通知レビュー記録 / Agent Input Queue 入口

> Historical note: この文書は AI Team experiment era の通知レビュー記録であり、通常の Codex 開発の正本ではない。
> 通常開発ではこの queue / Mission 運用を入口にしない。

作成日: 2026-05-09

このファイルは、旧来の外部通知レビュー記録の入口であり、現在は Agent Input Queue への互換ポインタとして扱う。

現在の正本:

- 入口: `docs/ai-team/ops/notification-intake/README.md`
- policy: `docs/ai-team/ops/notification-intake/policy.md`
- sanitized entry template: `docs/ai-team/ops/notification-intake/template.md`
- queue: `docs/ai-team/ops/notification-intake/queue.md`
- run logs: `docs/ai-team/ops/notification-intake/runs/`

## 運用方針

- Sakura / ChatGPT は Gmail を read-only で読み、raw email body を保存せず sanitized entry を作る。
- Codex は queue の `pending` entry を読み、Bloomlog Agent OS の Mission lifecycle に従って処理する。
- Human は gated operation の approval / rejection のみを担当する。
- Human をメール本文転記係、diff 確認係、dashboard 目視係にしない。

## 保存禁止

- raw email body。
- secret / token / API key / OAuth secret。
- dashboard URL。
- project ID、account ID、organization ID、内部 ID。
- 請求詳細、個人情報。

## 新規 entry の追加先

新規通知候補は、このファイルではなく `docs/ai-team/ops/notification-intake/queue.md` に追加する。

形式は `docs/ai-team/ops/notification-intake/template.md` に従う。
