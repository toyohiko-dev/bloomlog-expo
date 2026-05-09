# Mission Template

## mission id

`mission-YYYYMMDD-short-name`

## title

<!-- Mission の短いタイトルを書く。 -->

## mission state

```yaml
status: proposed
owner_role: Parent Agent
current_phase: mission
selected_option: none
approval_required: no
approval_status: not-required
execution_status: not-started
verification_status: not-started
residual_risk: none
next_action: define scope and path type
last_updated: YYYY-MM-DD
```

状態更新は `docs/ai-team/mission-lifecycle.md` に従う。Parent Agent が integration / execution summary 後に更新する。Reviewer / QA は状態を直接変更しない。

## background

<!-- 背景、依頼元、関連 docs / issue / PR を書く。Human や Sakura を Agent 間通信路にしない。最終状態は repo / GitHub に残す。 -->

## goal

<!-- この Mission で達成することを書く。 -->

## success criteria

- 

## scope

- 

## out of scope

- 

## path type

該当するものを残す。

- docs-only safe path
- code branch + PR path
- DB / migration path
- secret / dashboard approval path

## required agents

該当するものを残す。

- Parent Agent
- Writer Agent
- Reviewer Agent
- QA Agent
- DB Inspector Agent
- Sakura
- Human

## approval gates

Human intervention は approval gate のみに限定する。

- approval required: yes / no
- approval type:
  - main merge
  - migration apply
  - migration repair
  - db push
  - destructive SQL
  - secret
  - dashboard
  - production write
  - none
- approval reason:

## target branch

`branch-name`

docs-only safe path では、Reviewer Agent が条件確認後、AI が作業ブランチへ auto commit / push する。

## output locations

- mission:
- tasks:
- reports:
- decision log:
- approval-needed:
- branch:
- PR:
- issue:

## prohibited content

- secret / token を保存しない。
- メール本文全文を保存しない。
- Human に Agent 間通信の転記を依頼しない。
