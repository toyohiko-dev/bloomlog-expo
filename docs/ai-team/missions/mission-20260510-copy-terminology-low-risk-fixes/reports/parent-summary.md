# Parent Summary: Low-Risk Copy Fixes From Terminology Audit

作成日: 2026-05-10

## 結論

`mission-20260510-copy-terminology-audit` の Reviewer report で code-pr-ready とされた low blast radius の文言修正を実装した。

## 何を変えたか

- `app/collection/collection-filters.tsx`
  - mojibake fallback title を `名前未設定` に修正した。
- `app/collection-next/page.tsx`
  - `Collection Next` を `思い出アルバム 検証版` に変更した。
  - `既存の /collection を見る` を `思い出アルバムに戻る` に変更した。
- `app/collection-next/pavilion-album.tsx`
  - `area_id` を含む empty state を日本語 UI 文言へ変更した。
  - `pavilion_visit` を含む empty state を日本語 UI 文言へ変更した。

## なぜ必要か

Reviewer report で、ユーザー向け文言に mojibake、英語ラベル、route path、DB column 名、内部 activity type が出ていることが確認されたため。

## どこまで変えたか

code-pr-ready とされた明確な copy fix のみに限定した。

## 何を変えていないか

- ブランド表記 `Bloomlog` / `BloomLog` は変更していない。
- fallback 文言 `名前未設定` / `タイトル未設定` / `未設定` の標準化はしていない。
- `来場日を開く` / `来場日を作成する` の CTA 方針は変更していない。
- DB、migration、secret、dashboard、production write は行っていない。
- route、page、component は追加していない。

## Validation

実行したコマンド:

```powershell
rg -n "蜷榊燕|Collection Next|既存の /collection|area_id|pavilion_visit が追加" app\collection-next app\collection\collection-filters.tsx
git diff --check
npm.cmd run lint
npm.cmd run build
```

結果:

- `rg`: 対象のユーザー向け問題文字列は残存なし。
- `git diff --check`: passed。
- `npm.cmd run lint`: passed。
- `npm.cmd run build`: passed。

補足:

- build 中に `/collection-next` の `listAreas` read-only fetch failed log が出たが、build は成功した。
- `pavilion_visit` は `app/collection/collection-filters.tsx` に内部値として残っているが、ユーザー向け文言ではないため今回の対象外。

## Residual Risk

- `/collection-next` は検証ページであり、今後本採用する場合は別途 UX review が必要。
- product-decision findings は未実装。

## Next Action

- 必要であれば、この branch から PR を作成する。
- ブランド表記、fallback 標準、date CTA は product-decision follow-up として扱う。
