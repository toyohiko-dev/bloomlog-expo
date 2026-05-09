# Approval Needed Template

## approval id

`approval-YYYYMMDD-short-name`

## mission id

`mission-YYYYMMDD-short-name`

## approval type

該当するものを残す。

- main merge
- migration apply
- migration repair
- db push
- destructive SQL
- secret
- dashboard
- production write

## requested action

<!-- Human に承認してほしい操作を具体的に書く。Human を Agent 間通信路にしない。 -->

## exact command / SQL / setting

secret / token は書かない。メール本文全文も保存しない。

```text

```

## target environment

- local / preview / production:
- service:
- project / app:

## risk

- 

## rollback

- rollback possible: yes / no
- rollback plan:
- rollback risk:

## verification

- 

## approval options

Human は次のいずれかを選ぶ。

- approve
- reject
- request changes

## approval result

- selected option:
- decided by:
- decided at:
- notes:
