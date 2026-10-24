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

## 開発環境とNodeの区分（2026-10-24 JST確認）

Codex・さくらちゃん・チェオンちゃんを含む各開発セッションは、開始前にこの区分を確認する。以下は確認時点の値で、更新後は実体を再確認する。

| 対象 | 確認済みの版・識別情報 | 用途・状態 |
| --- | --- | --- |
| ChatGPTアプリ | 表示名はChatGPT、Store内部識別子はOpenAI.Codex、26.1021.2667.0 | 内部識別子を画面名のCodexと取り違えない。別パッケージOpenAI.ChatGPT-Desktopの表示名はChatGPT Classic |
| Windows通常Node | 24.22.1、C:\Program Files\nodejs\node.exe | BloomLogの開発・テストに使用。更新後に28テスト・lint・型検査・build・未認証HTTP確認が成功 |
| ChatGPT computer-use Node | 24.22.1、%LOCALAPPDATA%\OpenAI\Codex\runtimes\cua_node\d09305ddf6413603\bin\node.exe | アシスタント内部用。ChatGPT更新で修正済み。アプリ用Nodeとは別 |
| ChatGPT primary Node | 24.19.0、%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe、bundle26.1017.22136 | 別管理。正規の個別更新手順・自動更新条件は未確認。BloomLog検証には使わず、直接置換・キャッシュ削除をしない |
| Vercel Functions | managed24.x | 具体的パッチ番号は未確認。公式告知は管理ランタイムへの修正版展開中。再デプロイ成功やビルドNodeを、Functionsの修正完了の証拠としない |

開発・検証ルール:

1. 各セッションの最初と検証前にPowerShellで次を実行し、PATH上で実際に使うNodeの版と実体を記録する。内部ランタイムの版で代用しない。

   ~~~powershell
   Get-Command node | Select-Object Source
   node --version
   node -p process.execPath
   ~~~

2. BloomLogはアプリ用の修正済みNode24系（現時点の最低版24.22.1、package.jsonのenginesと.node-versionも参照）で検証する。通常パスと違う場合は検証前に解消する。npm経由のコマンド・子プロセスも同じNodeを使うことを確認する。
3. 変更に必要な動作確認・test・lint・型検査・buildを終えた範囲だけコミットする。テスト件数やbuild成功だけで全機能確認済みとは扱わない。未検証分を公開に混ぜない。
4. 文書・ログ・commitに秘密値、認証情報、ユーザーの個人データ・写真を含めない。既存記録・写真を保護し、破壊的DB操作をしない。
5. 現在の方針では専用テスト環境、Docker、WSLを追加しない。環境分離は完成後・リリース前に再検討する。新しい課金・権限・セキュリティ設定変更は個別確認する。

参照: [Node.js 2026年10月の公式勧告](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases)、[Vercel公式告知](https://vercel.com/kb/bulletin/node-js-security-advisory)。バージョンだけから実際の悪用可能性や被害を断定しない。
