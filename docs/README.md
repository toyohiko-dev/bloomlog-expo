# Docs Structure

`docs/` は、用途ごとに次の3系統へ整理する。

- `product/`
  - プロダクト仕様の正本
  - プロジェクト概要、用語、現在の開発方針、実装状態を置く

- `ai-team/`
  - 過去の AI Team experiment era の資料
  - 通常の Codex 開発入口ではない
  - 必要な場合だけ、履歴、調査ログ、旧 Mission record として参照する

- `archive/`
  - 旧資料の退避先
  - 削除せずに残したい Markdown を移す

---

## まず読む

通常開発では、まず root `AGENTS.md` と作業対象に近い domain `AGENTS.md` を確認する。

追加で、プロダクト仕様が必要な場合は以下を読む。

1. `docs/product/overview.md`
   - プロジェクトの全体像
   - 用語定義
   - 体験価値とドメイン構造

2. `docs/product/dev.md`
   - 現在の開発方針
   - UI / UX / データ構造の注意点

3. `docs/product/current-status.md`
   - 現時点の実装状態
   - 認証、フォント、思い出アルバム、DB の注意点

---

## Domain Rules

- root `AGENTS.md`
  - repo 全体の最小原則

- `app/AGENTS.md`
  - UI / UX / frontend / route / component / copy

- `supabase/AGENTS.md`
  - DB / migration / RLS / policy / Supabase

---

## 書き分けルール

### product に書くもの

- 確定したプロダクト仕様
- 概念とドメイン構造
- 用語定義
- 画面構成
- 現在の開発方針
- 現時点の実装状態

---

### ai-team にあるもの

- 過去の AI 運用実験資料
- Mission / Report / Decision Log の履歴
- notification intake などの旧運用資料
- DB / RLS 調査ログ

通常開発の作業ルールや入口としては扱わない。
必要になった場合だけ、履歴資料として読む。
---

### archive に移すもの

- 古い仕様
- 使わなくなった案
- 重複した資料
- 役割を終えたMD

削除せず、必ず退避する。

---

## 運用ルール

- 通常開発の入口は root `AGENTS.md` と domain `AGENTS.md` に固定する
- プロダクト仕様の正本は `docs/product/` に置く
- `docs/ai-team/` は通常開発の入口にしない
- 迷った場合は削除せず `archive/` に移動する
- 同じ内容を複数ファイルに書かない
- 最新版は上書き、過去版は `archive/` に保存する

---

## 判断基準

- プロダクト仕様として確定した内容 → `product/`
- UI / frontend 作業ルール → `app/AGENTS.md`
- DB / Supabase 作業ルール → `supabase/AGENTS.md`
- 過去の AI 運用実験や調査ログ → `ai-team/`
- 古くなったが残したい → `archive/`

---

## 目的

- どこを見ればよいかを明確にする
- 開発の文脈を維持する
- 人間とAIの役割を分離する

ドキュメントで開発を止めないための構造とする。
