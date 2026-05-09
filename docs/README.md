# Docs Structure

`docs/` は、用途ごとに次の3系統へ整理する。

- `product/`
  - 人間向けの最新資料
  - プロジェクト概要、仕様、引き継ぎ、開発メモを置く

- `ai-team/`
  - AIチーム（Codex）向けの資料
  - AI運用ルール、Mission record、承認前判断材料を置く

- `archive/`
  - 旧資料の退避先
  - 削除せずに残したい Markdown を移す

---

## まず読む

開発に入る前に必ず以下を確認する。

1. `docs/product/overview.md`
   - プロジェクトの全体像
   - 用語定義
   - 現在のブランチと構造

2. `docs/product/dev.md`
   - 現在の設計判断
   - 実装方針
   - 未解決の論点

---

## AIチーム向け

- `AGENTS.md`
  - AI Team / Agent OS 作業の唯一の入口

- `docs/ai-team/mission-lifecycle.md`
  - Mission state 管理の正本

- `docs/ai-team/agent-operating-model.md`
  - Agent 役割と承認境界の参照 docs

- `docs/ai-team/agent-review-workflow.md`
  - review / approval flow の参照 docs

- `docs/ai-team/agent-communication-protocol.md`
  - Agent 間通信の参照 docs

- `docs/ai-team/templates/`
  - Mission / report / decision log などのテンプレート

Mission artifacts は運用記録であり、恒久ルールではない。完了済み・superseded の Mission は再開しない。

---

## 書き分けルール

### product に書くもの（人間向け）

- 概念（Event / Area / Pavilion / Spot）
- 用語定義
- 画面構成
- 開発の意思決定理由
- 引き継ぎ内容

「人に説明する内容」を置く。

---

### ai-team に書くもの（AI向け）

- Codexへの指示
- タスクの前提条件
- 実装依頼
- 制約条件

「AIにやらせる内容」を置く。

---

### archive に移すもの

- 古い仕様
- 使わなくなった案
- 重複した資料
- 役割を終えたMD

削除せず、必ず退避する。

---

## 運用ルール

- 正本として読む資料は `product/` と `ai-team/` に置く
- AI Team / Agent OS 作業の入口は `AGENTS.md` に固定する
- 迷った場合は削除せず `archive/` に移動する
- 同じ内容を複数ファイルに書かない
- 最新版は上書き、過去版は `archive/` に保存する

---

## 判断基準

- 人に説明したい内容 → `product/`
- Codexに実装させる内容 → `ai-team/`
- 古くなったが残したい → `archive/`

---

## 目的

- どこを見ればよいかを明確にする
- 開発の文脈を維持する
- 人間とAIの役割を分離する

ドキュメントで開発を止めないための構造とする。
