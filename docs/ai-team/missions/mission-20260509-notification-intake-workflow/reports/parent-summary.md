# Parent Summary: Gmail Notification Intake Workflow

作成日: 2026-05-09

## 結論

この Mission は `completed` とする。

Gmail に届く Supabase 通知を起点に、AI が取得、正規化、分類、repo 照合、decision package 作成、approval gate 判定を行う docs-only workflow を定義した。

Bloomlog app 本体への Gmail 連携、Gmail API、Apps Script、webhook、cron、notification inbox、ops dashboard は非目的として明示し、実装しなかった。

## 何を作ったか

- Mission definition
- Decision log
- Parent / Writer / Reviewer / QA tasks
- Writer / Reviewer / QA reports
- Parent summary

## なぜ必要か

外部通知は、本番 DB、secret、dashboard、migration、deploy、billing、domain など実運用に影響する可能性がある。

一方で、通知本文を人間が転記したり、通知を起点に app 本体へ Gmail 連携を入れたりすると、Bloomlog の責務が広がりすぎる。

そのため、AI が read-only に取得、分析、repo 照合を行い、対応不要 / docs記録 / code変更候補 / DB対応候補 / dashboard変更候補 / Human approval needed に分け、gate 対象は承認前に止める workflow が必要だった。

## 変更したこと

- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/mission.md` を作成した。
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/decision-log.md` を作成した。
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/tasks/` を作成した。
- `docs/ai-team/missions/mission-20260509-notification-intake-workflow/reports/` を作成した。

## 変更していないこと

- app code は変更していない。
- `lib/` は変更していない。
- `supabase/` は変更していない。
- Supabase migration は作成していない。
- DB write、`db push`、migration repair は実行していない。
- secret、env、dashboard 設定は変更していない。
- `package.json` は変更していない。
- Gmail API、Apps Script、webhook、cron は追加していない。
- Bloomlog app 本体に Gmail 連携を組み込んでいない。

## validation

実行した確認:

```powershell
git status --short
git diff --name-only
git diff --stat
rg "Gmail|Supabase|Vercel|GitHub|approval|db push|migration repair" docs\ai-team\missions\mission-20260509-notification-intake-workflow
git diff --cached --name-only
git diff --cached --stat
```

結果:

- docs-only safe path: yes
- code change: no
- DB / migration change: no
- secret / dashboard change: no
- approval gate required for this Mission: no

## 残リスク

- 実 Gmail 通知を使った pilot は未実施。
- Gmail connector の検索条件、権限、取得可能メタ情報は未確認。
- Supabase / Vercel / GitHub の実通知で provider-specific な分類項目が必要になる可能性がある。

## rollback

runtime、DB、secret、dashboard には影響しない。

必要になった場合は、この Mission directory の docs-only commit を revert する。

## pushed

Yes.

- branch: `chore/ai-team-state`
- remote: `origin/chore/ai-team-state`
- commit: recorded in final response

## next action

実際の Supabase Gmail 通知を 1 件から数件、read-only で pilot review する。

pilot ではメール本文全文を保存せず、sanitized summary、action class、repo 照合結果、approval gate 要否だけを `docs/ai-team/notification-review-log.md` または新規 lightweight Mission に記録する。
