# Writer Report: Copy / CTA / Page Title / Terminology Audit

## mission id

`mission-20260510-copy-terminology-audit`

## task id

`task-002-writer-copy-audit`

## agent role

- Writer Agent

## status

completed

## summary

`tasks/writer.md` に従い、`app/`、`lib/`、`docs/product/` を read-only で確認した。UI 文言の直接修正は行っていない。

確認結果として、公開導線外の検証ページ `/collection-next` に英語・技術語がユーザー向け文言として残っていること、`app/collection/collection-filters.tsx` に mojibake した代替タイトルが 1 件残っていることを確認した。固定用語（来場日、思い出、思い出アルバム、タイムライン、記録）は主要導線では概ね維持されている。

## input files read

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/current-status.md`
- `docs/product/dev.md`
- `docs/product/collection-treemap.md`
- `docs/product/tech-debt.md`
- `docs/ai-team/mission-lifecycle.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/mission.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/writer.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/writer-report.md`
- `app/layout.tsx`
- `app/page.tsx`
- `app/_components/app-primary-nav.tsx`
- `app/_components/account-menu.tsx`
- `app/login/page.tsx`
- `app/login/login-form.tsx`
- `app/profile/page.tsx`
- `app/profile/profile-form.tsx`
- `app/sessions/page.tsx`
- `app/sessions/new/page.tsx`
- `app/sessions/new/session-create-form.tsx`
- `app/sessions/[id]/page.tsx`
- `app/sessions/[id]/activity-log-form.tsx`
- `app/sessions/[id]/delete-buttons.tsx`
- `app/collection/page.tsx`
- `app/collection/collection-filters.tsx`
- `app/collection-next/page.tsx`
- `app/collection-next/pavilion-album.tsx`
- `lib/activity-types.ts`
- `lib/sessions.ts`
- `lib/session-shared.ts`

## output files changed

- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/writer-report.md`

## commands run

```powershell
Get-Content -LiteralPath docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/writer.md
Get-ChildItem -LiteralPath docs/product -Recurse -File | Select-Object -ExpandProperty FullName
Get-Content -LiteralPath docs/ai-team/mission-lifecycle.md
Get-ChildItem -LiteralPath docs/ai-team/missions/mission-20260510-copy-terminology-audit -Recurse -File | Select-Object -ExpandProperty FullName
Get-Content -LiteralPath docs/product/overview.md
Get-Content -LiteralPath docs/product/current-status.md
Get-Content -LiteralPath docs/ai-team/missions/mission-20260510-copy-terminology-audit/mission.md
Get-Content -LiteralPath docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/writer-report.md
rg --files app lib docs/product
rg -n "譚･蝣ｴ譌･|諤昴＞蜃ｺ|諤昴＞蜃ｺ繧｢繝ｫ繝舌Β|繧ｿ繧､繝繝ｩ繧､繝ｳ|險倬鹸|繝ｭ繧ｰ繧､繝ｳ|繝ｭ繧ｰ繧｢繧ｦ繝・繝励Ο繝輔ぅ繝ｼ繝ｫ|菫晏ｭ・菴懈・|霑ｽ蜉|邱ｨ髮・蜑企勁|謌ｻ繧弓蟋九ａ繧弓髢句ｧ弓邯壹￠繧弓Google|繧ｿ繧､繝医Ν|繧ｵ繝槭Μ繝ｼ|繧ｳ繝ｬ繧ｯ繧ｷ繝ｧ繝ｳ|Collection|Visit|Activity|Timeline|Summary|Memory|Log" app lib docs/product
rg -n "title|description|metadata|aria-label|placeholder|button|submit|CTA|隕句・縺慾h1|h2" app lib
git status --short
Get-Content -Encoding UTF8 -LiteralPath app/page.tsx
Get-Content -Encoding UTF8 -LiteralPath app/layout.tsx
Get-Content -Encoding UTF8 -LiteralPath app/collection-next/page.tsx
Get-Content -Encoding UTF8 -LiteralPath app/collection-next/pavilion-album.tsx
Get-Content -Encoding UTF8 -LiteralPath app/_components/app-primary-nav.tsx
Get-Content -Encoding UTF8 -LiteralPath app/_components/account-menu.tsx
Get-Content -Encoding UTF8 -LiteralPath lib/activity-types.ts
Get-Content -Encoding UTF8 -LiteralPath app/login/page.tsx
Get-Content -Encoding UTF8 -LiteralPath app/login/login-form.tsx
Get-Content -Encoding UTF8 -LiteralPath app/sessions/page.tsx
Get-Content -Encoding UTF8 -LiteralPath app/sessions/new/page.tsx
Get-Content -Encoding UTF8 -LiteralPath app/sessions/new/session-create-form.tsx
Get-Content -Encoding UTF8 -LiteralPath app/sessions/[id]/page.tsx
Get-Content -Encoding UTF8 -LiteralPath app/sessions/[id]/activity-log-form.tsx
Get-Content -Encoding UTF8 -LiteralPath app/collection/collection-filters.tsx
Get-Content -Encoding UTF8 -LiteralPath app/collection/page.tsx
Get-Content -Encoding UTF8 -LiteralPath docs/product/overview.md
Get-Content -Encoding UTF8 -LiteralPath docs/product/collection-treemap.md
rg -n "BloomLog|Bloomlog|Collection Next|pavilion_visit|area_id|Account|Visit|Activity|Timeline|Summary|Memory|Log" app lib docs/product
rg -n "タイトル未設定|名前未設定|未設定|まだありません|まだメモ|この思い出にはまだメモ" app lib
Get-Content -Encoding UTF8 -LiteralPath docs/product/current-status.md
Get-Content -Encoding UTF8 -LiteralPath docs/product/dev.md
Get-Content -Encoding UTF8 -LiteralPath docs/product/tech-debt.md
git diff --name-only
```

## findings

| priority | category | file | line | current wording | issue | suggested follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | terminology drift / mojibake | `app/collection/collection-filters.tsx` | 428 | `蜷榊燕譛ｪ險ｭ螳・` | 画像 alt 用の fallback title が mojibake している。ユーザーに直接見える可能性は低いが、アクセシビリティ文言としては壊れている。近接する表示 fallback は `名前未設定`（449行）で、同じ概念の文言も揺れている。 | code-pr |
| P2 | English leakage / domain mismatch | `app/collection-next/page.tsx` | 61 | `Collection Next` | 検証ページのラベルが英語のまま。`docs/product/overview.md` では Collection は `思い出アルバム` と定義され、AGENTS 固定語でも `思い出アルバム` が指定されている。検証ページであることは `docs/product/dev.md` に明記されているため、修正は product decision なしで code-pr 候補。 | code-pr |
| P2 | English leakage / technical wording | `app/collection-next/page.tsx` | 75 | `既存の /collection を見る` | ユーザー向け CTA に route path が露出している。検証ページの内部導線としては理解できるが、日本語 UI 前提の通常文言としては硬い。 | code-pr |
| P2 | English leakage / technical wording | `app/collection-next/pavilion-album.tsx` | 459 | `まだ area_id が解決できるパビリオン訪問はありません。` | DB column 名 `area_id` がユーザー向け empty state に露出している。`docs/product/collection-treemap.md` では Area は「ゾーン」とも扱われており、UI では技術語を避けるべき。 | code-pr |
| P2 | English leakage / technical wording | `app/collection-next/pavilion-album.tsx` | 545, 559 | `pavilion_visit が追加されると表示されます。` | activity type の内部値 `pavilion_visit` がユーザー向け empty state に露出している。固定語・日本語 UI 方針からは `パビリオンの思い出` などへの置換候補。 | code-pr |
| P3 | terminology drift / brand casing | `docs/product/overview.md`, `app/layout.tsx`, `app/page.tsx`, `app/login/page.tsx`, `app/profile/page.tsx`, `app/profile/profile-form.tsx` | docs: 1,7,37 / app: layout 13, page 77, login 46,51, profile 21,95 | docs: `Bloomlog`; app: `BloomLog` | ブランド表記の大文字小文字が docs と app で揺れている。固定用語には含まれていないが、ページタイトル・本文・プロフィール説明に出るため表記統一の判断が必要。 | product-decision |
| P3 | terminology drift | `app/collection/collection-filters.tsx`, `app/sessions/[id]/page.tsx`, `lib/sessions.ts`, `lib/activity-types.ts` | collection 80,449 / session 258,385 / lib/sessions 392,429 / activity-types 102 | `名前未設定` / `タイトル未設定` / `未設定` | 同じ「思い出タイトルがない」状態に複数の fallback が使われている。画面文脈で意図的な可能性はあるが、アルバムとタイムラインで見え方が揺れる。 | product-decision |
| P3 | CTA inconsistency | `app/page.tsx`, `app/sessions/new/page.tsx`, `app/sessions/new/session-create-form.tsx` | app/page 109 / new/page 42,44,65 / form 162 | `来場日を開く` / `来場日を作成する` | ホームでは同じ date submit が「開く」、作成ページでは「作成する」。既存来場日がある場合の分岐を踏まえると意図的な可能性はあるが、初回ユーザーには操作結果が少し違って見える。 | product-decision |
| no issue | no issue | `app/_components/app-primary-nav.tsx` | 11-13 | `ホーム` / `来場日一覧` / `思い出アルバム` | 主要ナビゲーションは固定語を維持している。 | no-action |
| no issue | no issue | `app/sessions/[id]/page.tsx` | 329-335 | `タイムライン` / `今日の流れ` / `入力した思い出が時系列で並びます。` | 固定語 `タイムライン` と説明の内容は `docs/product/overview.md` の定義（Activity を時系列で表示）と整合している。 | no-action |
| no issue | no issue | `app/layout.tsx` | 14 | `万博の来場日ごとの思い出を記録して振り返れるアプリ` | metadata description は固定語 `来場日`、`思い出`、`記録` を含み、概ね product overview と整合している。ブランド表記のみ別 finding で扱う。 | no-action |

## reviewed consistency notes

- `docs/product/overview.md` は正式仕様として、`来場日`、`思い出`、`思い出アルバム`、`タイムライン`、`記録` の概念を確認した。
- `docs/product/current-status.md` はフォント・Google OAuth 方針が中心で、copy / terminology の追加矛盾は見つからなかった。
- `docs/product/dev.md` と `docs/product/collection-treemap.md` により、`/collection-next` は検証ページであることを確認した。したがって `/collection-next` の文言 issue は本番主要導線より優先度を一段下げた。
- `app/` と `lib/` は read-only で確認し、UI 文言は変更していない。
- `supabase/`、`migrations/`、`package.json`、lockfile、`.env*` は変更していない。

## validation

- validation performed:
  - `git diff --name-only` を report 編集前に実行し、作業開始時点で差分なしを確認した。
  - `rg` と `Get-Content -Encoding UTF8` で対象文言と行番号を確認した。
  - report 編集後に `git diff --name-only`、`git diff --stat`、`git diff --check`、`git status --short` を実行した。
- validation result:
  - changed file は `reports/writer-report.md` のみ。
  - `git diff --check` は warning のみで whitespace error なし。
  - app / lib 変更なし。
- validation not performed:
  - runtime / browser smoke は read-only copy audit の範囲外。
- reason:
  - 本 task の completion criteria は report completeness と prohibited path 非変更であり、アプリ実行は要求されていない。

## diff summary

- changed files: `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/writer-report.md`
- docs-only: yes
- code change: no
- app / lib files changed: no
- approval gate candidate: no

## risks

- `/collection-next` は検証ページのため、検証用途として意図的に技術語を残している可能性がある。
- ブランド表記 `Bloomlog` / `BloomLog` は product-sensitive な判断を含むため、Writer Agent では修正案を確定していない。
- fallback 文言（`名前未設定` / `タイトル未設定` / `未設定`）は文脈ごとの意図があり得るため、確定 issue ではなく product-decision 候補として扱う。

## rollback

- rollback needed: no
- rollback plan: git revert or follow-up docs correction
- rollback not needed because: this report is docs-only and app / lib files were not changed

## unknowns

- `Bloomlog` と `BloomLog` の正式ブランド表記。
- `タイトル未設定` と `名前未設定` のどちらを思い出 fallback の標準文言にするか。
- `/collection-next` をユーザーが触る前提の検証ページとして扱うか、内部検証ページとして技術語露出を許容するか。

## approval required?

no

## human intervention required?

no

## next action

- Reviewer Agent reads `tasks/reviewer.md` and reviews this report.
