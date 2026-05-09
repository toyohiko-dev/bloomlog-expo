# Mission: Browser Verification Stop Root Cause

作成日: 2026-05-09

```yaml
status: active
owner_role: Parent Agent
current_phase: mission
selected_option: none
approval_required: no
approval_status: not-required
execution_status: not-started
verification_status: not-started
residual_risk: root cause not yet isolated
next_action: Run QA Agent bounded reproduction and classify the stop reason
last_updated: 2026-05-09
```

## 目的

ブラウザ検証が止まる理由を、推測ではなく再現ログ、実行環境、依存関係、起動手順、認証状態、タイムアウト条件から切り分ける。

この Mission は「ブラウザ検証が止まったので Mission 全体を blocked にする」ためのものではない。止まる理由を分類し、以後の Mission で `verification-partial` として扱うべき環境制約なのか、修正すべき repo / script / setup 問題なのかを判定する。

## 背景

Bloomlog Agent OS では、QA Agent が lint、build、test、必要に応じた browser / app smoke verification を担当する。ただし browser automation failure は Mission 全体の blocker と直結させず、core execution、static verification、runtime verification、human smoke verification を分離して扱う。

今回の問題は、ブラウザ検証が止まる理由が未分類のため、AI が安全側に倒れすぎたり、逆に根拠なく検証完了扱いにしたりするリスクがあること。

## 成功条件

- ブラウザ検証停止の原因候補を、少なくとも次のどれかに分類する。
  - repo / app code 起因
  - local environment 起因
  - browser automation tooling 起因
  - auth / OAuth / session 起因
  - network / service dependency 起因
  - timeout / long-running process handling 起因
  - reproduction not confirmed
- 再現に使ったコマンド、観測ログ、停止位置、終了コードまたは timeout 条件を report に残す。
- AI が次回から自力で実行できる bounded verification command を定義する。
- 実行不能な検証が残る場合は、Mission blocker ではなく residual risk として分離する。
- 必要であれば follow-up task を作る。

## 非目的

- app code の修正はこの Mission の主目的ではない。
- Supabase 本番 DB write、migration、`db push`、migration repair は行わない。
- secret、OAuth client secret、dashboard 設定は変更しない。
- 人間にスクリーンショット取得や目視確認を依頼することを標準フローにしない。

## Approval gate

この Mission は docs-only / read-only / local verification の範囲では Human approval 不要。

Human approval が必要になる条件:

- 本番 DB write が必要になった場合。
- destructive SQL が必要になった場合。
- `db push` または migration repair が必要になった場合。
- secret / dashboard / OAuth provider / redirect URL の変更が必要になった場合。
- main merge が必要になった場合。

## 初期仮説

現時点では root cause は未確定。最初に検証すべき仮説は次の通り。

1. Next dev server が long-running process で、Agent が完了待ちして止まったように見えている。
2. dev server 起動後の browser smoke が、port / URL / health check を待てずに timeout している。
3. OAuth / auth required page に入っており、browser automation がログイン待ちで停止している。
4. Supabase env が未設定または接続不能で、画面遷移が client/server error になっている。
5. Playwright / browser dependency / sandbox が Agent 実行環境に存在しない。
6. Next.js / Turbopack の初回 compile が遅く、短い timeout で失敗している。
7. app error overlay または hydration error が出ているが、Agent がそれを収集できていない。
8. Vercel production と local dev の検証対象 URL が混ざっている。

## 変更範囲

この Mission 作成時点の変更範囲は `docs/ai-team/missions/mission-20260509-browser-verification-stop/` 配下のみ。app code、lib、supabase、migrations、package.json、env は変更しない。
