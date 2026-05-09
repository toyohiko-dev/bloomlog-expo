# Task Template

## task id

`task-001-short-name`

## mission id

`mission-YYYYMMDD-short-name`

## assigned agent

該当するものを残す。

- Parent Agent
- Writer Agent
- Reviewer Agent
- QA Agent
- DB Inspector Agent
- Sakura

## input files

- 

## target files / target area

- 

## allowed operations

- read docs / code
- create or edit docs
- inspect diff
- run validation commands
- create report

## prohibited operations

- Human を Agent 間通信路にすること。
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

- 

## completion criteria

- 

## human intervention required?

yes / no

Human intervention が yes になるのは approval gate のみ。

## if yes, why

- approval type:
- reason:
- approval-needed file:
