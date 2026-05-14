# Bloomlog Workflows

## 通常の product development

標準フロー:

1. small scoped branch を切る。
2. 関連コードと必要最小限の docs を読む。
3. 最小差分で修正する。
4. lint / build / 必要な確認を行う。
5. PR を作る。
6. merge する。

Mission lifecycle や multi-agent orchestration は通常フローにしない。

## docs-only safe path

以下のみの場合は docs-only safe path とみなす:

- docs 変更
- handoff
- README 更新
- wording 整理
- 運用整理

以下を含まないこと:

- app/
- lib/
- supabase/
- migrations/
- package.json
- secret
- DB write
- migration repair
- db push

docs-only safe path では:

- AI が diff 確認を行う。
- commit / push まで AI 主導で進める。
- 人間を転記係に戻さない。

## DB / Supabase workflow

AI が主体的に行う:

- read-only introspection
- schema diff 確認
- migration impact 分析
- rollback 案作成
- lint / build / type check

人間 approval gate:

- 本番 DB write
- destructive SQL
- migration apply
- migration repair
- db push
- secret 変更
- dashboard 設定変更

## Browser / runtime verification

verification を分離して考える:

- L1: static verification
- L2: automated runtime verification
- L3: human smoke verification

browser automation failure だけで Mission 全体を blocked にしない。

## anti-patterns

避けること:

- endless investigation
- docs-only retreat
- safety recursion
- investigation recursion
- human transport layer 化
- roleplay 的 AI Team 運用
- 何でも Mission 化すること
