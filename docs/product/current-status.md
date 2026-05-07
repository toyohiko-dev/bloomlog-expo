## フォント方針（恒久対応）

恒久的な方針:
- 日本語 UI の主要フォントは `next/font/local` を使う
- フォントファイルはリポジトリ内で self-host する
- UI 用テキストと等幅フォントは分けて管理する
- フォント変数は `app/layout.tsx` で適用する
- グローバル CSS では `--font-sans` と `--font-mono` 経由で利用する
- 特に屋外利用やモバイル利用を考慮し、細さより可読性を優先する
- `app/fonts/` のような import しやすい配置を優先する
- ビルド時・実行時ともに外部フォント取得に依存しない

推奨ウェイト方針:
- 本文: 400〜500
- 小さな文字: 400
- ボタン: 500〜600
- 見出し: 600

実装メモ:
- フォントファイルは `app/fonts/` のような import しやすいディレクトリに置くのが望ましい
- ビルド時や実行時に外部フォント取得へ依存する構成は避ける

現在の暫定状態:
- 現在のアプリは暫定対応としてシステムフォールバックフォントを使っている
- この構成によりデプロイの安定性は保てているが、タイポグラフィは端末依存の要素が残っている
- 次のフォント対応は `next/font/local` を前提とし、`next/font/google` に戻さない

## Google OAuth 実装メモ

- Google OAuth の開始処理は server action ではなく client component 側で実装する
- `supabase.auth.signInWithOAuth()` はブラウザ環境から呼び出す
- `redirectTo` には `window.location.origin` をベースにした `/auth/callback` を渡す
- `localhost:3000` 向けの開発用フォールバックは使用しない
