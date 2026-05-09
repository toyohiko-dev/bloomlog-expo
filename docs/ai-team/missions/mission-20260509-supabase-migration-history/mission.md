# Mission: remote migration 履歴空問題の read-only 棚卸し

## mission id

`mission-20260509-supabase-migration-history`

## title

remote migration 履歴空問題の read-only 棚卸し

## mission state

```yaml
status: superseded
owner_role: Parent Agent
current_phase: finalization
selected_option: superseded by mission-20260509-operational-rebaseline
approval_required: no
approval_status: not-required
execution_status: not-required
verification_status: passed
residual_risk: none; historical purity pursuit was intentionally abandoned by the operational rebaseline
next_action: none; use mission-20260509-operational-rebaseline as the current operational baseline
last_updated: 2026-05-09
```

## background

Bloomlog の Supabase remote migration history が空または欠落しているため、`npx supabase db push` が repo 側の全 migration を未適用として扱う可能性がある。

この Mission は、Human や Sakura を Agent 間通信路にせず、Agent が repo files を正として read-only 調査、repo migration と remote schema の照合、repair 候補整理、`db push` 可否判断、approval-needed 案作成まで進められる状態を作る。

関連 docs:

- `AGENTS.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-docs-map.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/supabase-db-introspection.md`

## goal

remote migration history 空または欠落の原因と影響を read-only で棚卸しし、次に Human approval gate へ進める場合の判断材料を揃える。

## success criteria

- repo migration 一覧と remote migration history の見え方が整理されている。
- remote schema / RLS / policy / trigger / function が read-only で確認され、repo migration の期待状態と照合されている。
- 問題が `history-only drift`、`schema drift`、`unknown`、`wrong project suspected`、`tooling / link issue suspected` のどれに近いか分類されている。
- `migration repair` 候補表が作られている。
- `db push` を使ってよいか、使ってはいけないかの判断材料が書かれている。
- DB write が必要な候補は `approval-needed.md` に exact command / SQL / risk / rollback / verification 案として整理されている。
- 各 Agent は task file を読み、結果を `reports/` 配下に書く設計になっている。

## scope

- Mission 一式の作成。
- 各 Agent task file の作成。
- read-only 調査の作業設計。
- approval gate の明確化。
- 後続 Agent の report 出力先の定義。

## out of scope

- DB write。
- migration repair の実行。
- `db push` の実行。
- destructive SQL。
- `supabase/migrations/` の変更。
- `app/`、`lib/`、`package.json`、`.env*` の変更。
- archive 移動。
- ファイル削除。

## path type

- DB / migration path
- docs-only safe path

## required agents

- Parent Agent
- DB Inspector Agent
- Reviewer Agent
- QA Agent
- Sakura
- Human

## approval gates

- approval required: yes
- approval type:
  - migration repair
  - db push
  - production write
  - destructive SQL
- approval reason:
  - `migration repair` は remote migration history table への write を伴う。
  - `db push` は production DB write を伴う。
  - 個別 SQL 適用が候補になる場合も production DB write を伴う。
  - destructive SQL は実行候補になった時点で Human approval gate が必要。

## target branch

`chore/ai-team-state`

docs-only safe path として、Reviewer Agent が条件確認後、Human の追加承認を待たずに AI が作業ブランチへ auto commit / push する。

## output locations

- mission: `docs/ai-team/missions/mission-20260509-supabase-migration-history/mission.md`
- tasks: `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/`
- reports: `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/`
- decision log: `docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md`
- approval-needed: `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
- branch: `chore/ai-team-state`
- PR: not created in this Mission setup step
- issue: not created in this Mission setup step

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human に Agent 間通信の転記を依頼しない。
- Sakura を Agent 間通信路にしない。
- approval gate 前に production DB write、migration repair、`db push`、destructive SQL を実行しない。
