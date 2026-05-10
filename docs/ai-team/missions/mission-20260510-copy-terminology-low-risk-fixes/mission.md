# Mission: Low-Risk Copy Fixes From Terminology Audit

作成日: 2026-05-10

```yaml
status: completed
owner_role: Parent Agent
current_phase: finalization
selected_option: implement code-pr-ready low blast radius copy fixes only
approval_required: no
approval_status: not-required
execution_status: completed
verification_status: passed
residual_risk: product-decision findings remain out of scope
next_action: keep brand casing, fallback wording standard, and date CTA decisions as separate product-decision follow-ups
last_updated: 2026-05-10
```

## 目的

`mission-20260510-copy-terminology-audit` の Reviewer report で `code-pr` ready とされた low blast radius の文言修正だけを実装する。

## 背景

文言監査 Mission では、明確な code-pr 候補と product-sensitive な判断候補を分離した。

この Mission では、次だけを実装対象にする。

- `app/collection/collection-filters.tsx` の mojibake fallback title。
- `app/collection-next/page.tsx` の `Collection Next`。
- `app/collection-next/page.tsx` の `既存の /collection を見る`。
- `app/collection-next/pavilion-album.tsx` の `area_id` 露出。
- `app/collection-next/pavilion-album.tsx` の `pavilion_visit` 露出。

## 非目的

- ブランド表記 `Bloomlog` / `BloomLog` の決定。
- fallback 文言 `名前未設定` / `タイトル未設定` / `未設定` の標準化。
- `来場日を開く` / `来場日を作成する` の CTA 方針決定。
- DB、migration、secret、dashboard、production write。
- route、page、component の追加。

## Source Refs

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/dev.md`
- `docs/product/collection-treemap.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/reviewer-report.md`

## 変更範囲

変更したコード:

- `app/collection/collection-filters.tsx`
- `app/collection-next/page.tsx`
- `app/collection-next/pavilion-album.tsx`

記録:

- `docs/ai-team/missions/mission-20260510-copy-terminology-low-risk-fixes/mission.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-low-risk-fixes/reports/parent-summary.md`

## Approval

Human approval required: no

理由:

- Reviewer report で code-pr-ready とされた低リスク文言修正だけに限定した。
- DB、migration、secret、dashboard、production write を含まない。

## Verification

実行した検証:

- `git diff --check`
- `rg` による対象文字列の残存確認。
- `npm.cmd run lint`
- `npm.cmd run build`

結果:

- lint: passed。
- build: passed。
- `git diff --check`: passed。
- build 中に `/collection-next` の read-only fetch failed log が出たが、build は成功した。

## Final Result

Completed.

Product-decision 候補は未実装のまま残した。
