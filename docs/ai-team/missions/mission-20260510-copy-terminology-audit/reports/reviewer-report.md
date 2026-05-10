# Reviewer Report: Copy / CTA / Page Title / Terminology Audit

## mission id

`mission-20260510-copy-terminology-audit`

## task id

`task-003-reviewer-check`

## agent role

- Reviewer Agent

## status

completed

## summary

`reports/writer-report.md` の findings は、repo files 上の根拠に基づいており、概ね actionable と判断する。

特に `app/collection/collection-filters.tsx` の mojibake fallback は明確な修正候補である。`/collection-next` の英語・技術語露出も確認できたが、`docs/product/dev.md` で検証用ページと定義されているため、主要導線の blocker ではなく follow-up code-pr 候補として扱うのが妥当である。

ブランド表記 `Bloomlog` / `BloomLog` と fallback 文言 `名前未設定` / `タイトル未設定` / `未設定` は、単純な誤字修正ではなく product-sensitive な統一判断を含むため、先に product-decision として切り出すべきである。

## input files read

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/current-status.md`
- `docs/product/dev.md`
- `docs/product/collection-treemap.md`
- `docs/ai-team/mission-lifecycle.md`
- `docs/ai-team/agent-docs-map.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/mission.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/reviewer.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/writer-report.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/reviewer-report.md`
- `app/collection/collection-filters.tsx`
- `app/collection-next/page.tsx`
- `app/collection-next/pavilion-album.tsx`
- `app/_components/app-primary-nav.tsx`
- `app/layout.tsx`
- `app/page.tsx`
- `app/login/page.tsx`
- `app/profile/page.tsx`
- `app/profile/profile-form.tsx`
- `app/profile/setup/page.tsx`
- `app/sessions/page.tsx`
- `app/sessions/new/page.tsx`
- `app/sessions/new/session-create-form.tsx`
- `app/sessions/[id]/page.tsx`
- `app/sessions/[id]/activity-log-form.tsx`
- `app/sessions/[id]/delete-buttons.tsx`
- `lib/activity-types.ts`
- `lib/sessions.ts`

## output files changed

- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/reviewer-report.md`

## accepted findings

| priority | writer finding | reviewer assessment | evidence | recommended follow-up | follow-up path |
| --- | --- | --- | --- | --- | --- |
| P1 | `app/collection/collection-filters.tsx` の mojibake fallback title | accepted. `AlbumThumbnail` に渡す `title` fallback が壊れており、アクセシビリティ文言としても不適切。近接表示 fallback とも不一致。 | `app/collection/collection-filters.tsx:428` に `蜷榊燕譛ｪ險ｭ螳・`、同ファイル `:449` に `名前未設定`。 | 同じ画面の表示 fallback と揃える最小修正を follow-up code-pr で実施する。 | code-pr |
| P2 | `/collection-next` の `Collection Next` | accepted with scope note. `docs/product/overview.md` では Collection は `思い出アルバム`、AGENTS 固定語にも `思い出アルバム` がある。検証ページなので優先度は P2 のままで妥当。 | `app/collection-next/page.tsx:61`、`docs/product/overview.md:79`。 | 検証ページであることを残すなら `検証版` などの日本語補助ラベルへ置換する。 | code-pr |
| P2 | CTA `既存の /collection を見る` | accepted with scope note. route path がユーザー向け CTA に露出している。検証ページ内導線として理解はできるが、日本語 UI 方針とはずれる。 | `app/collection-next/page.tsx:75`、`docs/product/dev.md` の `/collection-next` 検証用ページ定義。 | `思い出アルバムに戻る` など、route path を出さない CTA にする。 | code-pr |
| P2 | empty state の `area_id` 露出 | accepted. DB column 名が UI 文言に出ている。`Area` は product docs ではドメイン概念として扱われるが、`area_id` は実装語。 | `app/collection-next/pavilion-album.tsx:459`、`docs/product/collection-treemap.md` の Area 説明。 | `ゾーンが紐づいたパビリオンの思い出はまだありません。` など、実装語を避ける。 | code-pr |
| P2 | empty state の `pavilion_visit` 露出 | accepted. activity type の内部値が UI 文言に出ている。固定語 `思い出` と日本語 UI 方針に寄せるべき。 | `app/collection-next/pavilion-album.tsx:545`、`:559`。 | `パビリオンの思い出が追加されると表示されます。` などへ置換する。 | code-pr |
| no issue | 主要ナビゲーションの固定語維持 | accepted. Writer の no-action 判定は妥当。 | `app/_components/app-primary-nav.tsx` の `来場日一覧` / `思い出アルバム`。 | 変更不要。 | no-action |
| no issue | `タイムライン` 表示の定義整合 | accepted. Writer の no-action 判定は妥当。 | `app/sessions/[id]/page.tsx` の `タイムライン`、`docs/product/overview.md:73`。 | 変更不要。 | no-action |
| no issue | metadata description の固定語整合 | accepted with brand caveat. 固定語自体は整合している。ブランド表記だけ別 finding として扱う。 | `app/layout.tsx:14`。 | 固定語は変更不要。ブランド表記は product-decision 側で扱う。 | no-action / product-decision |

## rejected or downgraded findings

| writer finding | reviewer decision | reason | follow-up path |
| --- | --- | --- | --- |
| `Bloomlog` / `BloomLog` の表記ゆれを P3 finding とする | accepted as issue, but not code-pr-ready | `docs/product/overview.md` は `Bloomlog`、app は `BloomLog` が複数箇所に出る。ただし AGENTS 固定用語にはブランド表記ルールがなく、正式表記の判断が必要。 | product-decision |
| `名前未設定` / `タイトル未設定` / `未設定` の fallback ゆれ | accepted as audit observation, downgraded from direct fix | 文脈により「思い出の名称」「編集中タイトル」「activity type fallback」が混在している。全置換すると意味を壊す可能性がある。 | product-decision |
| `来場日を開く` / `来場日を作成する` の CTA 差分 | accepted as observation, downgraded to low-risk decision | `app/sessions/new/page.tsx` には既存来場日の場合 `来場日を開く` があり、状態分岐として意図的な可能性が高い。ホーム CTA は「日付 submit が既存なら開く / なければ作る」動作なら product copy 判断が必要。 | product-decision |

## missing audit areas

- Writer report は `app/` と `lib/` の主要 UI 文言を広く確認しており、Reviewer が spot verification した範囲では重大な漏れは見つからなかった。
- `app/profile/setup/page.tsx` にも `BloomLog` があることを Reviewer 側で追加確認した。Writer のブランド finding には含めてよい追加 evidence であり、別 issue ではない。
- `app/sessions/[id]/activities/new/page.tsx`、`app/sessions/[id]/activity-logs/[logId]/edit/page.tsx`、`app/sessions/[id]/edit/page.tsx` には固定語が出ているが、Reviewer の spot check では明確な不整合は見つからなかった。
- Runtime / browser smoke はこの docs-only read-only audit の completion criteria 外であり、未実施で問題ない。

## approval gate assessment

- approval required: no
- reason: この Reviewer task は `reports/reviewer-report.md` の docs-only 更新のみであり、app / lib / supabase / migrations / package / env を変更しない。
- approval-needed file: none
- follow-up approval note: 実際に UI 文言を変更する場合は、この Mission 内では実施せず、code-pr または product-decision Mission に切り出す。DB write、migration、secret、dashboard 変更は不要。

## suggested next Mission / PR split

| split | scope | reason |
| --- | --- | --- |
| code-pr: obvious copy fixes | `app/collection/collection-filters.tsx` の mojibake、`app/collection-next/**` の route path / `area_id` / `pavilion_visit` / `Collection Next` 表示 | product decision なしで日本語 UI 方針と固定語へ寄せられる。検証ページのみを含めるなら blast radius は小さい。 |
| product-decision: brand casing | `Bloomlog` と `BloomLog` の正式表記決定 | docs と app のどちらへ合わせるかはブランド判断。決定後に code-pr へ進める。 |
| product-decision: fallback wording standard | `名前未設定` / `タイトル未設定` / `未設定` の使い分け | 画面文脈ごとの意味を決めてから置換する必要がある。 |
| product-decision: date CTA behavior wording | `来場日を開く` / `来場日を作成する` | 実際の動作が upsert 的なら「開く」のままでも成立する。初回ユーザー向け copy として判断が必要。 |

## validation

- validation performed:
  - `Get-Content -Encoding UTF8` で task、mission、product docs、writer report、placeholder reviewer report を確認した。
  - `rg` で Writer findings の対象文言を spot verification した。
  - `git status --short` で作業前の差分を確認した。
  - Reviewer report のみを編集した。
  - 編集後に `git diff --name-only`、`git diff --stat`、`git diff --check`、`git status --short` を確認した。
- validation result:
  - Writer の actionable findings は repo files 上で再現できた。
  - Review 上、Human approval gate が必要な操作はない。
  - app / lib / supabase / migrations / package / env は変更していない。
  - working tree には Writer task 由来の `reports/writer-report.md` 差分と、この Reviewer task 由来の `reports/reviewer-report.md` 差分がある。
  - `git diff --check` は CRLF 変換 warning のみで、whitespace error は出ていない。
- validation not performed:
  - runtime / browser smoke
  - lint / build
- reason:
  - 本 task は docs-only review report 作成であり、実装変更や runtime 確認を要求していない。

## risks

- `/collection-next` は検証ページのため、技術語をあえて残している可能性はある。ただしユーザーが触れる UI として表示される以上、follow-up code-pr で日本語化する価値はある。
- ブランド表記と fallback 文言は product-sensitive であり、Reviewer が修正文言を確定すると AGENTS の「UI 文言の無断変更」に抵触する可能性がある。
- Writer report 自体に raw external content、secret、dashboard URL、project ID、internal ID は見当たらなかった。

## rollback

- rollback needed: no
- rollback plan: git revert or follow-up docs correction
- rollback not needed because: this report is docs-only and app / lib files were not changed

## next action

- QA Agent reads `tasks/qa.md` and verifies docs-only state and report completeness.
