# Reviewer Task: docs-only / approval gate review

## task id

`task-003-reviewer-docs-only-and-gate-review`

## mission id

`mission-20260509-supabase-migration-history`

## assigned agent

- Reviewer Agent

## input files

- `AGENTS.md`
- `docs/ai-team/agent-operating-model.md`
- `docs/ai-team/agent-docs-map.md`
- `docs/ai-team/agent-review-workflow.md`
- `docs/ai-team/agent-communication-protocol.md`
- `docs/ai-team/supabase-migration-ops.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/mission.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/parent.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/db-inspector.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/qa.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
- relevant reports under `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/`

## target files / target area

- diff review
- Mission docs review
- output: `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/reviewer-report.md`

## allowed operations

- read docs / code
- inspect diff
- run validation commands
- create report

## prohibited operations

- Human を Agent 間通信路にすること。
- Sakura を Agent 間通信路にすること。
- secret / token / メール本文全文の保存。
- DB write。
- migration repair。
- db push。
- archive 移動。
- ファイル削除。
- approval gate なしの production write。

## commands allowed

```powershell
git status --short
git diff --name-only
git diff --stat
git diff --cached --name-only
git diff --cached --stat
rg "<pattern>"
```

## commands prohibited

```powershell
npx supabase db push
npx supabase migration repair
```

加えて、destructive SQL、secret 変更、dashboard 変更、production write は Human approval gate なしに実行しない。

## expected output

`reports/reviewer-report.md` に次を書く。

- findings。
- docs-only safe path 判定。
- changed files が `docs/` 配下のみか。
- `app/`、`lib/`、`supabase/`、`supabase/migrations/`、`package.json`、`.env*` が含まれていないか。
- archive 移動やファイル削除がないか。
- approval gate 判定。
- push を止める理由があるか。
- next action。

## completion criteria

- docs-only safe path 条件を確認している。
- DB write / migration repair / `db push` / destructive SQL が実行されていないことを確認している。
- Mission docs が Human や Sakura を Agent 間通信路にしていないことを確認している。
- push 可否が明確である。

## human intervention required?

no

## if yes, why

- approval type: none
- reason: docs-only safe path review 自体は Human approval gate ではない。
- approval-needed file: `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
