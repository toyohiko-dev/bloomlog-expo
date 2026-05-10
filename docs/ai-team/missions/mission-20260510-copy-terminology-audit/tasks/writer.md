# Task: Writer Read-Only Copy Audit

## task id

`task-002-writer-copy-audit`

## mission id

`mission-20260510-copy-terminology-audit`

## assigned agent

- Writer Agent

## input files

- `AGENTS.md`
- `docs/product/overview.md`
- `docs/product/current-status.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/mission.md`
- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/tasks/writer.md`

## target files / target area

Read-only targets:

- `app/**/*.tsx`
- `app/**/*.ts`
- `lib/**/*.ts`
- `docs/product/**/*.md`

Writable target:

- `docs/ai-team/missions/mission-20260510-copy-terminology-audit/reports/writer-report.md`

## allowed operations

- read docs / code
- use `rg` to find text, labels, metadata, CTA, and fixed terms
- create or edit `reports/writer-report.md`
- inspect diff

## prohibited operations

- edit `app/`
- edit `lib/`
- edit `supabase/`
- edit `migrations/`
- edit `package.json` or lockfiles
- edit `.env*`
- fix UI wording inside this Mission
- save secret / token / raw external content
- ask Human to copy findings between Agents

## commands allowed

```powershell
rg --files app lib docs/product
rg -n "来場日|思い出|思い出アルバム|タイムライン|記録|ログイン|ログアウト|プロフィール|保存|作成|追加|編集|削除|戻る|始める|開始|続ける|Google|タイトル|サマリー|コレクション|Collection|Visit|Activity|Timeline|Summary|Memory|Log" app lib docs/product
rg -n "title|description|metadata|aria-label|placeholder|button|submit|CTA|見出し|h1|h2" app lib
git diff --name-only
git diff --stat
```

## audit categories

Writer Agent should classify findings into:

- fixed-term violation: fixed Bloomlog terms are missing, translated, or replaced.
- terminology drift: same concept appears with multiple Japanese labels.
- English leakage: user-facing UI contains English that should likely be Japanese.
- CTA inconsistency: similar actions use different verbs or tone.
- page title inconsistency: metadata, heading, and navigation labels disagree.
- domain mismatch: wording conflicts with `docs/product/`.
- no issue: reviewed and consistent.
- needs Human / Sakura decision: wording choice is product-sensitive.

## expected output

Update `reports/writer-report.md` with:

- files inspected.
- commands run.
- findings table.
- severity / priority.
- evidence path and line number when possible.
- suggested follow-up type: docs-only, code-pr, product-decision, no-action.
- explicit note that no app / lib files were changed.

## completion criteria

- `reports/writer-report.md` contains enough detail for Reviewer Agent to work without chat context.
- Findings distinguish confirmed issues from candidates.
- No UI wording is changed.
- Human intervention required is `no`, unless a product wording decision is explicitly needed.

## human intervention required?

no
