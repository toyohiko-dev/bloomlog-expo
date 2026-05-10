# Bloomlog AI-IS AS-IS
## 会話型AI運用から repo-driven AI Team へ

## なぜこの文書が必要か

Bloomlog の AI-IS は、最初から repo-driven Agent OS として設計されたものではない。

実際には、ChatGPT を中心とした会話型AI運用から始まり、運用上の痛みと試行錯誤を通じて、現在の repo-driven AI Team へ進化してきた。

この文書は TO-BE 提案ではなく、現在の AI-IS が「なぜその構造になったのか」を AS-IS として説明するための narrative overview である。

---

## 出発点

初期の Bloomlog 開発は、一般的な Chat 型 AI 開発に近かった。

```text
Human
↓
Chat で依頼
↓
AI が回答
↓
Human がコピペ
↓
Human が状態管理
```

この方式は初期学習には強力だった。

特に：

- 発想
- abstraction
- UX議論
- AI運用思想
- 問題整理

を高速に進化させる力があった。

しかし、長期運用では問題が顕在化した。

---

## 発生した問題

会話型運用では、Human が通信路になっていた。

例えば：

- スクリーンショット共有
- エラーログ転記
- diff コピペ
- branch 状態説明
- handoff 作成
- 状態要約

など。

さらに：

- 会話が長くなるほど状態が崩れる
- repo より chat context が優先される
- branch canonical が曖昧になる
- PM 役割が会話へ吸い込まれる
- schema より会話の勢いが優先される

といった問題も発生した。

---

## AI Team 化

これらを解決するため、Bloomlog は AI を単体回答者ではなく、役割分担された AI Team として扱う方向へ進化した。

導入されたもの：

- Mission lifecycle
- Reviewer
- QA
- DB Inspector
- approval gate
- decision-log
- queue system
- repo-driven state management

これにより、状態共有を chat memory ではなく repo へ寄せる方向へ進化した。

---

## Bloomlog AI-IS の思想

Bloomlog の中心思想は：

```text
AI operated development
```

である。

つまり：

- AI が作業者
- Human が承認者
- repo が shared memory
- Mission が bounded action
- approval gate が安全境界

という運用モデルを目指している。

また、Human を「通信路」へ戻さないことを重要原則としている。

---

## Path Concept

Bloomlog AI-IS における Path は単なる作業分類ではない。

Path は：

```text
AI がどこまで自律実行してよいか
```

を定義する autonomy boundary である。

代表例：

- docs-only safe path
- code branch + PR path
- DB / migration path

特に docs-only safe path は、「AI が安全に最後まで完走できる bounded lane」を定義するために生まれた。

---

## Queue System

Bloomlog では notification と execution を直接接続しない。

理由は：

- notification panic
- dashboard direct reaction
- unsafe production changes

を避けるためである。

そのため、notification はまず sanitized queue entry として intake され、その後 Mission 化される。

```text
Queue
↓
Mission
↓
Review
↓
Approval
↓
Execution
```

---

## 現在見えている課題

現在の AI-IS は大きく改善している。

しかし、以下の問題はまだ残る。

- chat補足依存
- schema enforcement不足
- machine-readable state不足
- branch canonical ambiguity
- Mission schema逸脱

ここで重要なのは、問題が単純に「AIがバカ」だからではないという点である。

むしろ本質は：

```text
Conversation AI を Execution OS として使っていた
```

ことにある。

Conversation AI は：

- 意図翻訳
- 即興整理
- abstraction
- 文脈適応

には強い。

しかし：

- strict schema
- canonical state
- deterministic execution
- state machine operation

には弱い。

現在の Bloomlog AI-IS は、この経験から進化した repo-driven AI Team の AS-IS である。
