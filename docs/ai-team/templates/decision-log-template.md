# Decision Log Template

> Historical note: この template は AI Team experiment era の Decision Log 運用向けであり、通常の Codex 開発の正本ではない。
> 大きな判断だけ、必要に応じて現在の docs 方針に沿って記録する。

## decision date

YYYY-MM-DD

## decision maker

該当するものを書く。

- Human
- Sakura
- Parent Agent

## mission id

`mission-YYYYMMDD-short-name`

## decision

<!-- 決定内容を書く。Human / Sakura の判断を Agent が再利用できる形にする。 -->

## state transition

- from:
- to:
- changed by:
- reason:
- blocker:
- unblock condition:

## alternatives considered

- 

## rationale

- 

## impact

- affected docs:
- affected code:
- affected DB / migration:
- affected secret / dashboard:
- affected operations:

## follow-up

- 

## revisit condition

- 

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human を Agent 間通信路にしない。
