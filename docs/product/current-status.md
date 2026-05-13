# Bloomlog Current Status

このファイルは、現時点の実装状態と近い将来の注意点を短くまとめる。
恒久仕様は `docs/product/overview.md`、開発方針の補足は `docs/product/dev.md` を正とする。

---

## アプリ構成

- Next.js App Router を使用している。
- TypeScript と Tailwind CSS を使用している。
- Supabase を DB / Auth として使用している。
- 主要 UI は日本語前提である。

---

## 認証

現在の状態:

- Google OAuth に対応している。
- OAuth 開始処理は client component 側で `supabase.auth.signInWithOAuth()` を呼び出す。
- `redirectTo` は `window.location.origin` をベースにした `/auth/callback` を使う。
- `/auth/callback` で code を session に交換し、プロフィール設定の有無で遷移先を分ける。
- `localhost:3000` 固定の開発用 fallback は使わない。

注意:

- OAuth redirect URL や provider 設定を変える場合は、実運用設定に影響するため承認 gate として扱う。

---

## フォント

現在の状態:

- 現在のアプリは、システムフォールバックフォントを CSS 変数経由で使っている。
- `app/layout.tsx` で `--font-noto-sans-jp` と `--font-geist-mono` 相当の font stack を指定している。
- `app/globals.css` では `--font-sans` と `--font-mono` を経由して利用している。
- `next/font/google` は使っていない。
- `next/font/local` による self-hosted font は、まだ導入していない。

今後の方針:

- 日本語 UI の読みやすさを優先する。
- 外部フォント取得に依存する構成へ戻さない。
- self-hosted font を導入する場合は、`next/font/local` を前提にする。
- フォントファイルを追加する場合は、bundle size とライセンスを確認する。

---

## 思い出アルバム

現在の状態:

- `/collection` が現行の思い出アルバム画面である。
- `/collection-next` は思い出アルバム表現の検証ページである。
- Pavilion 画像は `pavilions.image_path` を使って表示する。
- Area を使ったグルーピング表現は検証対象である。

注意:

- 本採用が決まるまでは、`/collection-next` の変更と `/collection` の変更を分けて扱う。
- ユーザー向け文言に route path、DB column、内部 enum をそのまま出さない。

---

## DB / Supabase

現在の状態:

- `supabase/migrations/` に migration ファイルがある。
- Auth、profiles、visit_sessions、activity_logs、pavilions、photo path、RLS 修正に関する migration が存在する。
- DB / migration / RLS 変更は `supabase/AGENTS.md` の承認 gate に従う。

注意:

- `db push`、migration repair、本番 DB write、destructive SQL は通常作業で実行しない。
- 必要になった場合は、対象、影響、rollback、検証方法を整理してから承認を求める。
