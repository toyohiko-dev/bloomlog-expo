# 外部通知分析用プロンプト

> Historical note: この文書は過去の通知分析プロンプトであり、通常の Codex 開発の正本ではない。
> 通常開発ではこのプロンプトを入口にしない。

Gmail 検索または ChatGPT の Gmail 連携で見つけた通知本文を分析するときは、次の定型プロンプトを使う。

## 基本プロンプト

```text
Plan only. Do not edit files.

以下は Supabase / Vercel / GitHub などの外部通知です。
Bloomlog にとって要対応か、日本語で整理してください。

目的:
- 通知の要点を要約する
- 重要度を分類する
- Bloomlog への影響範囲を分析する
- 必要な可能性がある対応を整理する
- 人間承認前に実装や設定変更へ進まない

制約:
- No file edits
- No migrations
- No dashboard changes
- No webhook
- No admin client
- コード変更しない
- route / page / component を追加しない
- service_role を前提にしない
- 日本語で出力する
- 対応不要の可能性も残す

出力項目:
1. 通知の要点
2. 重要度
   - 高 / 中 / 低
3. 送信元の信頼性
4. Bloomlog への影響範囲
   - 認証
   - デプロイ
   - DB
   - 環境変数
   - 課金
   - ドメイン
   - GitHub運用
   - 不明
5. 必要な可能性がある対応
   - コード変更
   - dashboard 設定変更
   - migration の可能性
   - 対応不要
   - 判断保留
6. 根拠
7. 不明点
8. 人間承認待ち事項
9. 承認後に Codex へ渡すべき要点

通知本文:
[ここに貼る]
```

## 使い方

- Gmail 上で候補メールを見つけたあとに使う
- 通知本文をそのまま貼る前に、不要な個人情報や秘密情報が含まれていないか確認する
- 出力結果は `docs/ai-team/notification-review-log.md` または GitHub Issue の下書きに転記する

## 補足

- このプロンプトの目的は分析であり、実装ではない
- 判断が曖昧な場合は、実装案より先に確認事項を増やす
- 重要度が高い通知でも、人間承認前に変更を進めない
