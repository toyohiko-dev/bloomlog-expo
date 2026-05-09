# Bloomlog Agent Mission Lifecycle

作成日: 2026-05-09

## 目的

このドキュメントは、Bloomlog Agent OS の Mission 状態を repo 上で管理するための最小ルールを定義する。

Mission の状態更新は Human の手作業ではなく、Parent Agent が repo files / branch / PR / issue に記録する。Human は gated write operation の承認または却下だけを行う。

## 状態フィールド

すべての `mission.md` には次のフィールドを持たせる。

```yaml
status: proposed | active | approval-needed | executing | verification-partial | completed | blocked | superseded
owner_role: Parent Agent
current_phase: mission | task | review | approval | execution | verification | finalization
selected_option: none | <option id or name>
approval_required: yes | no
approval_status: not-required | pending | approved | rejected
execution_status: not-started | not-required | in-progress | completed | failed | blocked
verification_status: not-started | not-required | passed | partial | failed | blocked
residual_risk: none | <short description>
next_action: <one concrete next action>
last_updated: YYYY-MM-DD
```

値は短く保つ。詳細な理由、SQL、検証結果、rollback、未確認事項は `decision-log.md`、`reports/parent-summary.md`、`reports/execution-report.md`、`approval-needed.md` に書く。

## Mission lifecycle states

| status | 意味 |
| --- | --- |
| `proposed` | Mission 案はあるが、scope / path / owner がまだ確定していない。 |
| `active` | Mission が確定し、Agent が task / review / docs-only 作業を進めている。 |
| `approval-needed` | production write、main merge、secret、dashboard、migration repair、`db push` など gated operation の Human 判断待ち。 |
| `executing` | 承認済みまたは approval 不要の操作を Agent が実行中。 |
| `verification-partial` | core execution は通ったが、runtime / browser / app smoke など一部検証が環境制約で未完了。 |
| `completed` | 必要な実行と検証が完了し、残リスクがない、または残リスクを別 follow-up に分離済み。 |
| `blocked` | 正確な blocker と unblock 条件があるため進めない。 |
| `superseded` | 新しい Mission、PR、package、方針がこの Mission を置き換えた。 |

## 変更権限

| actor | 状態変更権限 |
| --- | --- |
| Parent Agent | integration / execution summary 後に `mission.md` の状態を更新できる。最終状態の記録責任を持つ。 |
| Executor Agent | execution result state を report で提案できる。`mission.md` の最終状態は Parent が更新する。 |
| Writer Agent | task / report を更新できる。Mission 状態は直接変更しない。 |
| Reviewer Agent | findings と approval gate 判定を report に書く。Mission 状態は直接変更しない。 |
| QA Agent | validation 結果と residual risk を report に書く。Mission 状態は直接変更しない。 |
| DB Inspector Agent | read-only 調査、approval-needed 判定、rollback 案を report に書く。Mission 状態は直接変更しない。 |
| Sakura | 方針レビュー、人間意図の翻訳、監査観点を提供する。Mission 状態は直接変更しない。 |
| Human | gated write operation の approval / rejection のみを行う。Mission 状態の手動更新係にはしない。 |

## 状態遷移ルール

- `proposed -> active`: Parent が scope、path type、owner、next action を確定したとき。
- `active -> approval-needed`: Human approval gate が必要な操作を特定し、`approval-needed.md` または同等の approval package が準備できたとき。
- `approval-needed -> executing`: Human approval が記録された後のみ。
- `approval-needed -> blocked`: Human が却下した、または approval package に正確な blocker が見つかったとき。
- `executing -> completed`: 承認済み操作または approval 不要操作が完了し、必要な verification が pass したとき。
- `executing -> verification-partial`: core execution は pass したが、runtime / browser / app smoke verification が環境制約で利用できないとき。
- `verification-partial -> completed`: residual risk が記録され、未完了検証または rollback 判断が別 follow-up task / issue / Mission に分離されたとき。
- `any state -> blocked`: 正確な blocker と必要な unblock condition が書けるときだけ。
- `any state -> superseded`: 新しい Mission、PR、approval package、方針が置き換え先として明示されたとき。

`blocked` は「不安なので停止」には使わない。AI が read-only で調べられること、diff 確認、report 整理、rollback 案作成は先に行う。

## Parent finalization duties

Parent Agent は Mission finalization 時に次を行う。

- `mission.md` の状態フィールドを更新する。
- `decision-log.md` に状態遷移、承認結果、選択 option、残リスクを記録する。
- `reports/parent-summary.md` を更新または作成する。
- execution が発生した場合は `reports/execution-report.md` を更新または作成する。
- docs-only safe path の条件を満たす場合は commit / push する。
- 最終報告で pushed yes / no を明記する。

## Directory strategy

既存 Mission directory はこのルール導入だけでは移動しない。archive / 移動は別 Task として扱う。

推奨構造:

```text
docs/ai-team/missions/
  active/
    <mission-id>/
  completed/
    <mission-id>/
  blocked/
    <mission-id>/
  superseded/
    <mission-id>/
```

当面は既存の `docs/ai-team/missions/<mission-id>/` も有効とする。新規 Mission で状態別 directory を使う場合も、移動によって参照が壊れるときは Parent が `decision-log.md` と `reports/parent-summary.md` に移動理由を残す。

## Completion rule for partial verification

`verification-partial` は失敗ではない。次を満たす場合、Parent は `completed` に進めてよい。

- core execution result が成功している。
- 実行後の read-only verification または diff verification が pass している。
- 実行できなかった runtime / browser / app smoke verification の理由が report にある。
- 残リスクと rollback / follow-up 条件が明確である。
- 未完了検証をこの Mission の blocker とせず、別 follow-up task / issue / Mission に分離している。

## 禁止事項

- Mission 状態更新を Human の手作業に戻さない。
- Reviewer / QA が `mission.md` の状態を直接進めない。
- Human approval 前に gated write operation を `executing` にしない。
- blocker と unblock condition なしに `blocked` にしない。
- 置き換え先なしに `superseded` にしない。
- 状態管理のためだけに app code、Supabase migration、production SQL、`db push`、migration repair を実行しない。
