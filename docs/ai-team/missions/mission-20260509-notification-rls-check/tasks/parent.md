# Task: Parent Integration

## task id

`task-002-parent`

## mission id

`mission-20260509-notification-rls-check`

## assigned agent

- Parent Agent

## input files

- DB Inspector report
- Reviewer report
- QA report
- approval-needed if created

## target files / target area

- `mission.md`
- `decision-log.md`
- `reports/parent-summary.md`
- notification intake queue entry

## allowed operations

- read reports
- update mission state
- update decision log
- update queue
- commit / push docs-only changes when safe

## prohibited operations

- DB write。
- `db push`。
- migration repair。
- dashboard 変更。
- credential 変更。
- app / lib / package / env 変更。

## expected output

- Mission state updated according to lifecycle.
- Queue status reconciled.
- Approval gate package created if necessary.

## completion criteria

- Parent summary exists.
- Queue and Mission state are consistent.
- docs-only safe path checked if committing docs.

## human intervention required?

no unless gated operation is needed.
