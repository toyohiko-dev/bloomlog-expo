## Google OAuth 実装メモ
- Google OAuth 開始処理は server action ではなく client component 側で実行する
- `supabase.auth.signInWithOAuth()` はブラウザ側から直接呼ぶ
- `redirectTo` は `window.location.origin` ベースで `/auth/callback` を組み立てる
- `localhost:3000` の固定フォールバックは使用しない