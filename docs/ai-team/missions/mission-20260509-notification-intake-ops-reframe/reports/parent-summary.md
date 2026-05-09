# Parent Summary: Notification Intake Ops Reframe

作成日: 2026-05-09

## 結論

Notification intake は、継続 AI ops job として扱う構成へ見直した。

今後 Codex は `AGENTS.md` と `docs/ai-team/ops/notification-intake/README.md` を読み、`queue.md` の pending entry を処理すればよい。

## 何を変えたか

- `docs/ai-team/ops/notification-intake/` を新設した。
- `README.md`、`policy.md`、`template.md`、`queue.md`、`runs/20260509-sakura-gmail-readonly-pilot.md` を作成した。
- Sakura / ChatGPT、Codex、Human の責務を明記した。
- Ops と Mission の境界を定義した。
- Sakura Gmail read-only pilot の候補を raw body なしの sanitized entry として queue に入れた。
- `notification-review-log.md` を互換入口として更新した。

## なぜ必要か

Gmail 起点の通知 intake は一回限りではなく継続的に発生するため、毎回長いチャット指示に依存すると運用がぶれる。

repo 内に ops の入口、policy、template、queue、runs を持たせることで、Codex は短い指示で queue を処理できる。

## 変更していないこと

- app code は変更していない。
- `lib/` は変更していない。
- `supabase/` は変更していない。
- migrations は変更していない。
- `package.json` は変更していない。
- `.env*` は変更していない。
- DB write、`db push`、migration repair は実行していない。
- dashboard / secret は変更していない。
- Gmail API、Apps Script、webhook、cron は追加していない。

## Validation

実行した確認:

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --cached --name-only
git diff --cached --stat
git diff --cached --check
```

結果:

- docs-only safe path: yes
- code change: no
- DB / migration change: no
- secret / dashboard change: no
- approval gate required for this Mission: no

## Queue result

- `NTF-20260509-01`: pending。Supabase security alert。read-only DB Inspector follow-up Mission が次 action。
- `NTF-20260509-02`: triaged。Vercel internal incident notice。docs記録。
- `NTF-20260509-03`: triaged。Supabase auto pause warning。docs記録または対応不要寄り。
- `NTF-20260509-04`: completed。historical failed production deployment。

## Residual risk

- 実 Gmail connector の検索条件と取得メタ情報は未検証。
- `NTF-20260509-01` の actual DB state は未確認。
- provider-specific な queue fields は pilot を重ねて調整が必要になる可能性がある。

## Next action

`NTF-20260509-01` の read-only DB Inspector Mission を作成し、RLS / policy / sensitive columns の current state を確認する。
