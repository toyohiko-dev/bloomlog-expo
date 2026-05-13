# Bloomlog App AGENTS

## Scope

このファイルは `app/` 配下の UI / UX / frontend / route / component / copy 作業に適用する。

## 参照する仕様

- `docs/product/overview.md`
- `docs/product/dev.md`
- `docs/product/current-status.md`
- 関連する画面仕様や設計メモがある場合は `docs/product/` 配下の該当ファイル。

## UI / UX 原則

- 日本語 UI を前提にする。
- 固定用語「来場日」「思い出」「思い出アルバム」「タイムライン」「記録」を守る。
- UI 要件でドメインを歪めない。
- 既存の画面構成、導線、文言のトーンに合わせる。
- route path、DB column、内部 enum などの実装語をユーザー向け文言に出さない。
- デザイン検討は `app/` domain の作業として扱い、確定したプロダクト方針だけを `docs/product/` に反映する。

## 実装ルール

- 既存 page / component / action の責務を優先する。
- 新規 route / page / component は、既存修正で足りない場合だけ追加する。
- `app router` を勝手に広げない。
- UI 文言変更は最小にし、固定語や既存日本語用語を勝手に置き換えない。
- `/collection-next` のような検証ページは、既存本番画面への影響を分けて扱う。
- Next.js の API や構成を変更する場合は、root `AGENTS.md` の Next.js 注意書きに従い、必要な `node_modules/next/dist/docs/` を確認する。

## 検証

- UI 変更後は可能な範囲で lint / build / browser 確認を行う。
- 実行できなかった検証は理由と残リスクを報告する。
