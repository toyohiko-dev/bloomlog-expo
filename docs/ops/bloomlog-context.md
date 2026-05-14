# Bloomlog Context

## プロダクト概要

Bloomlog は、万博やイベントの体験を「来場日」単位で記録し、あとから振り返るためのイベント体験記録アプリである。

1日 = 1 来場日。
来場日の中に複数の「思い出」を記録する。

代表的な思い出:

- パビリオン訪問
- フード
- ピンバッジ
- イベント参加

## UI / UX 方針

- 日本語 UI を前提とする。
- 実装用語をユーザー向け UI に露出しない。
- 「記録」は action / verb として扱う。
- 「思い出アルバム」で後から振り返る体験を重視する。
- route path や DB column 名を UI 文言に混ぜない。

## 固定用語

変更しない:

- 来場日
- 思い出
- 思い出アルバム
- タイムライン
- 記録

## 開発方針

- small branch。
- minimal diff。
- root cause fix。
- lint / build を重視。
- low-risk 修正は軽量に回す。
- 不必要な docs 増殖を避ける。
- 人間を orchestration layer にしない。

## AI 運用の現状

2026-05 時点では、repo-first autonomous AI Team 実験は棚上げ中。

通常開発では:

- simple branch workflow
- PR-based review
- bounded execution
- human approval gate only for dangerous operations

を基本とする。
