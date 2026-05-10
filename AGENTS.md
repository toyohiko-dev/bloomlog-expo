<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bloomlog AGENTS

このファイルは、Bloomlog 開発時に AI が最初に読む軽量コンテキスト入口である。

目的は、同じ前提を毎回会話で説明し直さなくてよいようにすること。AI Team / Agent OS / Mission lifecycle を通常開発の標準フローとして起動するためのものではない。

## 1. 基本方針

- Bloomlog はイベント体験記録アプリである。
- 日本語 UI を前提とする。
- `docs/product/` を正式仕様として扱う。
- `docs/ops/` は開発時の軽量 playbook / skill として扱う。
- `docs/ai-team/` は過去の AI Team 実験・調査・handoff の履歴領域であり、通常開発の入口にしない。
- repo は外部記憶として使う。ただし repo を疑似組織や人間オーケストレーション媒体にしない。

## 2. 固定用語

以下の用語は勝手に変更しない。

- 来場日
- 思い出
- 思い出アルバム
- タイムライン
- 記録

禁止すること:

- 上記用語の英語化。
- 既存日本語用語の独自言い換え。
- DB column、route path、activity type などの実装詳細をユーザー向け UI に出すこと。
- UI 文言を、目的や影響範囲を説明せずに大きく変更すること。

## 3. 通常開発フロー

通常の Bloomlog product development は main-centered simple development とする。

基本形:

1. small scoped branch を切る。
2. 既存仕様と関連 docs を必要最小限だけ読む。
3. 最小差分で実装する。
4. lint / build / 必要な確認を行う。
5. PR を作成する。
6. checks が通り、blast radius が限定されていれば merge する。

low-risk copy fix、UI 微修正、docs-only 整理は Mission 化しない。

PR は単なる停止点ではなく risk check gate として使う。low blast radius で rollback が容易な変更は、必要以上に人間確認へ戻さない。

## 4. 人間と AI の役割

- AI は作業者であり、人間は承認者である。
- 人間をスクリーンショット係、目視確認係、手作業の転記係、diff 比較係にしない。
- read-only 調査、repo diff 確認、migration 影響分析、rollback 案作成、lint/build/test は AI が主体的に行う。
- 人間承認が必要なのは、本番 DB write、destructive SQL、secret 変更、dashboard 設定変更、migration 適用、migration repair、db push である。
- 「安全のため」という理由だけで、AI が可能な調査作業を人間へ戻さない。

## 5. 禁止事項

明示依頼または承認なしに、次を行わない。

- migration を作成または適用する。
- webhook / cron / Gmail API / Apps Script を追加する。
- `service_role` / admin client を追加する。
- ops dashboard / notification inbox を作る。
- route / page / component を大量追加する。
- `package.json` を不要変更する。
- secret や `.env*` を変更する。
- 本番 DB write、destructive SQL、dashboard 設定変更、db push、migration repair を実行する。

## 6. docs の使い分け

### `docs/product/`

正式仕様、用語、UX 方針、確定した技術方針を書く。

### `docs/ops/`

通常開発で繰り返し使う軽量 playbook / skill を書く。

### `docs/ai-team/`

AI Team / Agent OS 実験の履歴、過去 mission、過去 report を残す場所。通常開発では参照必須にしない。

### `docs/archive/`

退役済み資料、古い handoff、過去ログを置く。

新規 docs は増やす前に、既存 docs に追記できないか確認する。短命のメモは PR description に書けば足りる場合が多い。

## 7. 実装時の判断基準

実装に進む場合は、次の順で判断する。

1. product docs または現在の依頼に根拠があるか。
2. 既存構造の中で対応できるか。
3. 新規追加より既存修正で済むか。
4. 変更範囲を小さく保てるか。
5. root cause に対処しているか。
6. rollback または revert が容易か。

不要な拡張より、既存構造に沿った最小修正を優先する。

## 8. AI Team 実験の扱い

2026-05-10 時点で、Bloomlog の repo-first autonomous AI Team / parallel autonomous execution / Claude Code 的 multi-agent workflow 実験は棚上げする。

理由:

- human orchestration が消えなかった。
- single workspace 運用が限界だった。
- branch / reconcile topology が複雑化した。
- mission / role / docs が増殖した。
- execution より orchestration cost が大きくなった。

今後の通常開発では、Mission lifecycle、Parent / Reviewer / QA role chain、reconcile branch 常設を標準フローにしない。

必要になった場合だけ、より小さい sandbox repo または worktree isolation を前提に再検証する。
