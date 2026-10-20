# BloomLog 本番・テスト環境の分離

## 2026-10-20 に読み取り確認した現状

| 項目 | 本番 / 現状 | 用意した独立テスト構成 |
| --- | --- | --- |
| アプリ | Vercel bloomlog-expo / bloomlog-expo.vercel.app | 127.0.0.1:3100 / .next-test |
| 公開コミット | main: bad9b34ebb0d0acb343960e4b756c69fafea8b41 | codex/test-environment に保存、未公開 |
| Supabase | xavnxklqsupkosmywojn、東京、Postgres 17、ACTIVE_HEALTHY | testing/supabase、project_id=bloomlog-test、API 55321 / DB 55322 |
| Auth | アプリはGoogle OAuthのみ。現在のprovider設定・redirect allowlistは未取得 | 別Auth。Google無効の雛形。APIテストはダミーemailユーザーのみ |
| Storage | activity-photos、public=true、容量/MIME制限のbucket値はnull | 別Storageに同名の空bucket。コピーする写真なし |
| 環境変数 | ローカル.env.localにURL/anon keyの2変数。値は非表示・未変更 | testing/app.env.example → 承認後に.env.test.local、既存.env.localと別 |
| Vercel変数 | URL/anon keyがProduction/Preview/Developmentの3環境共通スコープ | 今回変更なし。将来クラウド化時は別projectの変数だけ設定 |

Vercel直近3件はGit main由来のProductionデプロイ。本番mainへのpushを避ける。
この作業ブランチはvercel.jsonのgit.deploymentEnabledで自動デプロイを無効化した。
本番・Preview・Development共通の変数は分離済みではないため、既存Previewを
テストとして使ってはならない。ダッシュボード設定・本番環境変数は未変更。
Supabaseで確認できたプロジェクトは本番1件、所属組織はfreeプラン。
別クラウド環境の作成・課金確認・契約は行っていない。

## 安全に準備したもの

- testing/supabase/migrations の独立スナップショット。public 9表、RLS、制約、
  index、プロフィール更新trigger、写真Storageと既存cleanup RPCを含む。
  本番のカタログ定義だけを参照。行データ、auth.users、写真、秘密値の取得・複製なし。
- seed.sql は固定のダミーイベント/エリア/国/スポット/館/別名だけ。
  ユーザー・来場日・記録・写真は初期投入しない。
- auto_expose_new_tables=false、全9表の権限はcanonical data-api-grants.sqlを利用。
  写真cleanupとGRANTの複製は自動テストでcanonicalファイルとの同一性を確認する。
- npm run dev:test はtestモード・127.0.0.1:55321・ローカルanon keyが必須。
  不足・本番URL・本番refのJWT・service_roleを拒否。プロセス環境変数が.env設定を
  上書きしていてもURLを確認して停止する。Nextは127.0.0.1:3100にbindする。
- npm run test:db はPGliteの一時PostgreSQL 18.6を使用。ソケット・DB接続文字列・
  永続データ・認証情報不要。auth/storageサービス定義だけ最小代替、publicの定義・
  RLS・cleanup・GRANTは実際のテスト用SQLを実行する。

スナップショットは現在の本番構造に合わせたテスト専用の別履歴であり、rootの
既存migration履歴修復ではない。user_id nullable、visit_date単独unique、
pavilionsのtext参照列など、観測した既存差分を勝手に修正していない。
本番で観測されない旧assign/sync triggerは追加していない。
rootの歴史的migrationは依然初期6表のCREATEがなく、混ぜて実行してはいけない。
将来のschema変更時はテストスナップショットとの差分をレビューする。

## 個別承認後の起動順（未実行）

1. Docker Desktop等の対応ランタイムを導入・起動する。
   このPCでdockerコマンド、標準パスの実体、Dockerサービスは見つかっていない。
   インストールには管理者権限/仮想化/WSL2/再起動が必要になる可能性がある。
   利用資格によるライセンス費用は導入前に確認する。今回はOS設定変更なし。
2. testing以下だけを対象に、固定版CLIでローカルSupabaseを起動する。
   npx supabase@2.121.0 start --workdir testing
   これはローカルvolume、Authキー/認証設定、StorageとDBを新規作成するため承認対象。
   公開portのbind範囲を確認し、必要なloopback制限やFirewall変更も事前確認する。
   本番link・rootの.tempを使用しない。db push / migration repairは禁止。
3. ローカルstackのanon keyだけを.env.test.localへ設定する（値を出力しない）。
   testing/app.env.exampleのURLとモードを使用し、.env.localは変更しない。
   実行後にmainの本番接続設定をテストへ戻す操作も不要。
4. npm run dev:test でアプリを起動する。
5. ダミーAuthユーザー作成を承認後、BLOOMLOG_ALLOW_LOCAL_AUTH_TEST=1を設定して
   npm run test:local を実行する。Auth→profile→Data API→Storage→写真guard/RPC→
   cookie付きアプリ/sessions描画まで検証する。画像は生成1ピクセルPNG。
   2つの架空emailアカウントがローカルstack内に残る。認証パスワード/tokenは
   メモリのみで生成し、出力・ファイル保存しない。テスト失敗時も本番には接続しない。
6. 再実行前はテストstackだけのresetが必要。これはデータ削除なので対象を確認して
   個別承認する。テスト以外のresetや停止を巻き込まない。

アプリUIのGoogleログインは別途テスト専用OAuth client/secret、Supabase provider、
callback/redirect設定の承認が必要。API側の架空emailログインでcookie付き画面を
検証しても、Google OAuth本番同等の通し検証済みとは扱わない。
クラウド公開が必要なら別Supabase project + 別Vercel projectを推奨する。
作成組織・料金見積・認証情報・Auth redirect・公開範囲を具体化して承認後に作成する。

## 検証結果と限界

- npm test：44件成功（うち一時PostgreSQLの実行検証8件）。
- 全9表×3role×4操作のACL、匿名のmaster/別名参照、私有表拒否、本人CRUD、
  他人の行の非表示・削除拒否・所有者偽装拒否、GRANT前の拒否、再実行を確認。
- npm run lint、npm run build：成功。
- testing/local-integration.cjs：構文確認のみ。実stack / Auth / Storage / ブラウザは未起動。
- PostgreSQL本番17とPGlite18.6は別バージョン。実Supabase17のAPI検証は未完了。
- npm audit：既存依存に18件（critical 1/high 14/moderate 2/low 1）。nextを含む。
  新規PGliteは監査対象指摘なし。今回の無関係な依存upgradeは実施していない。
  このためにも保存ブランチを本番へ反映せず、別途依存更新をレビューする。

## 参照

- https://vercel.com/docs/project-configuration/git-configuration
- https://supabase.com/docs/guides/local-development/cli/config
- https://supabase.com/docs/guides/local-development/database-migrations
