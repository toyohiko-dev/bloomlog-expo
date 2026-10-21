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

## 来場日ごとの振り返り

- 来場日詳細の既存サマリー欄と来場日一覧に、保存済みの種類・名称・件数から自動で振り返りを表示する。
- 本人が付けたタイトル・メモを上書きしない。一覧のタイトルが未設定の場合だけ自動タイトルを使う。
- 感情や体験を推測せず、パビリオンは現在の正式な表示名を優先し、同名の重複表示を避ける。
- 生成結果はDBに保存せず、現在の記録から毎回組み立てる。外部AIやAPIの追加はない。

---

## 思い出の新規入力の下書き

- 新規入力の下書きは、ログインユーザー・来場日・種類ごとに、このブラウザの localStorage に保存する。
- 画面移動や再読み込み後も文字情報と選択内容を復元する。保存成功時は保存した種類だけ消去し、失敗時は保持する。
- 写真本体は永続保存しない。写真を選んだ下書きを復元した場合は再選択が必要と表示する。
- 保存領域の利用不可や破損があっても入力画面を壊さず、永続保存できない場合は表示する。
- 編集画面はこの永続下書きの対象にしない。別のブラウザ・端末・接続先との同期はしない。

---

## 思い出アルバム

現在の状態:

- `/collection` が現行の思い出アルバム画面である。
- `/collection-next` は思い出アルバム表現の検証ページである。
- Pavilion 画像は `pavilions.image_path` を使って表示する。
- Area を使ったグルーピング表現は検証対象である。
- `/collection-next` の制覇マップは、実際の訪問データを使い、地図全体・花・訪問数・パビリオン名の一覧を含む PNG を端末内で作成できる。
- 出力画像のプレビュー・保存と、対応端末でのファイル共有に対応する。操作ボタンや表示中の拡大率は画像に含めない。
- 出力でも現在の検証用配置を使用する。密集した花は元位置への引出線を付けて重なりを避け、一覧は最大24件と残り件数を表示する。

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
