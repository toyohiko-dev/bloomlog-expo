# Data API grants and rebuild prerequisites

Supabase stops automatically granting access to new public tables on 2026-10-30.
Existing table ACLs remain unchanged. The four edited historical migrations make
application privileges explicit at their existing creation/authentication steps.
`data-api-grants.sql` expresses the complete nine-table application access matrix:

| Table | anon | authenticated | Application / existing design evidence |
| --- | --- | --- | --- |
| events | SELECT | SELECT | lib/sessions.ts getDefaultEventId/listEvents; app/sessions/actions.ts getFixedEventId |
| areas | SELECT | SELECT | lib/sessions.ts listAreas |
| pavilions | SELECT | SELECT | lib/sessions.ts listPavilions/getPavilion |
| pavilion_aliases | SELECT | SELECT | listPavilions nested pavilion_aliases(alias) selection |
| countries | none added | SELECT | No direct query today; existing countries_read_all_authenticated policy |
| spots | none added | SELECT | No direct query today; existing spots_read_all_authenticated policy |
| visit_sessions | none added | SELECT, INSERT, UPDATE, DELETE | lib/sessions.ts reads; app/sessions/actions.ts writes |
| activity_logs | none added | SELECT, INSERT, UPDATE, DELETE | lib/sessions.ts reads; app/sessions/actions.ts writes |
| profiles | none added | SELECT, INSERT, UPDATE | lib/profiles.ts / auth callback reads; app/profile/actions.ts upsert |

The master readers use createPublicSupabaseClient in lib/supabase/shared.ts,
which uses the anon key without session persistence. Hence events/areas/pavilions
and nested aliases need anon SELECT even on signed-in application pages.
Countries/spots authenticated SELECT follows the documented existing policy design
in docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md;
it does not introduce anonymous reads or master writes. This is an application
privilege manifest, not a copy of every existing production ACL (some are broader).

## Execution order and prerequisites

1. Identify a separate disposable/new/preview database. Never use the linked
   production project as a test target. This task does not authorize SQL execution.
2. Restore the reviewed initial schema and policies, then the ordered migrations.
   All nine public tables must exist with RLS enabled and appropriate reviewed
   policies. Schema USAGE and the standard Supabase roles must already exist.
3. Apply data-api-grants.sql as the table owner after those steps. It checks all
   nine tables, RLS and policy existence before any GRANT. Missing prerequisites
   raise an exception; the transaction must be rolled back. It does not validate
   policy semantics, create missing tables, enable RLS, or invent policies.
4. In that disposable database, verify table privileges plus allowed and denied
   row operations for each role. Static checks do not replace this DB verification.

The SQL names every table and privilege explicitly. It adds no service_role access,
sequence grants, automatic default privileges, broad schema-wide grants, or REVOKE.
Existing excessive ACLs are not removed by this file. Historical migrations already
applied are not rerun: do not replay them against production, use db push, or repair
migration history. Production needs no emergency ACL change for this announcement.
The photo cleanup migration and private schema are independent and unchanged.

## Pre-existing rebuild limitation (outside this grant change)

There is no initial CREATE TABLE SQL for visit_sessions, activity_logs, events,
areas, countries, or spots, and no supabase/config.toml. The first migration assumes
activity_logs exists. This migration directory alone cannot bootstrap an empty DB
or support a complete db reset. Obtain and review the missing baseline separately;
this task does not reconstruct it. The grant file now covers all nine tables once
that baseline exists, including the four remote-only master tables.

## Validation

Run node --test tests/supabase-data-api-grants.test.cjs for static checks of the
nine-table privilege matrix, app query coverage and prerequisite ordering.
Also run npm run lint and git diff --check. The grants were executed against
ephemeral PostgreSQL during validation. New provisioning with the complete
Supabase API remains unverified; production grants were not changed.

References:
- https://github.com/orgs/supabase/discussions/45329
- https://supabase.com/docs/guides/api/securing-your-api

## Profiles trigger rebuild parity (2026-10-24 JST)

Read-only inspection of production confirmed public.set_profiles_updated_at()
uses SECURITY INVOKER and SET search_path TO public. The original profiles-creation
SQL now declares both explicitly, so a future rebuild preserves that definition.
This follows the historical-source rebuild approach above; no new production
migration is needed for a setting already present. Do not replay this historical
migration, run db push, or repair history against production. This source edit has
not been applied to any database. Static tests check the declaration and trigger
binding; execution on a rebuilt database remains unverified, and the missing
initial baseline limitation still applies.

## GPS facility seed review (not applied)

`green-expo-facilities.seed.review.sql` is an inert review template outside migration history. It refuses execution while its reviewed row set, exact count and existing event identity are unset. No source ZIP identities or new UUIDs have been approved yet. It adds only reviewed new `pavilions` rows and never updates existing records, permissions or event assignments. Do not apply it, run `db push`, or repair history as part of local UI testing.

## GPS台帳接続（2026-10-25、ローカル実装・未適用）

- 入力: `BloomLog_GPS_implementation_data_20261025.zip`（1,400,621 bytes、SHA256 `b199e8f23c5e1028f78552ce85ea0a2e69d9b61ed65efcd8aa047fe9af1e343d`）。旧39MB ZIPは送信されていなかった。新ZIPのパッケージ内検証スクリプトも成功。
- `lib/green-expo-source-data.json` は屋外176区画＋補足52項目、屋内283出展回・30期間を保持。国80参加表明を施設にせず、屋内出展回・施設内項目を独立施設として増やしていない。
- 位置候補は屋外176＋補足の既定16＝192。未確定位置・旧図面のみの36項目も資料一覧に保持。推定・外挿・資料競合・非入口・現地未検証・誤差不明・production_approved=falseを維持。250mは検索窓であって精度ではない。GPSは明示操作時のみ。自動確定しない。
- 現DBの11施設は全件読み取り確認したが、出典による同一性は未確認。名称だけの対応付け・置換・既存イベント一括割当はしない。正式図面の点と架空イラスト上のアンカーは別物。今回の192件にイラストアンカーはない。
- 入力画面で公開資料の施設候補と来場日別の屋内出展を確認できる。未登録候補は保存先へ渡さない。7日間開催で正確な日程がない5件は期間内の可能性として表示。館内位置は不明。写真の位置と現在地は別操作。来場日を写真撮影日と自動的に同一視しない。

### 実DB変更を行う前の承認対象案（まだ実行不可）

対象プロジェクト `xavnxklqsupkosmywojn`、イベント `e60f2360-8147-4112-969a-00954596ceb6`（GREEN×EXPO2027）。

1. `public.pavilions` に **192件の新規追加案**。正確なUUID/名前/公式名/出典IDは `green-expo-facilities.rows.review.json`。列は既存 `id,name,official_name,is_active` のみ。屋外は出典版・区画別の名称で同名別区画を区別。UUIDは提案値でDB登録済みではない。既存11件の更新・削除・名前変更・記録移動はしない。将来の資料改訂時は同一性を再レビューし、版付きIDから自動統合しない。
2. 出展回や施設内位置を個別記録・編集・再閲覧まで保持するには、`public.activity_logs` の nullable `place_context jsonb` 列の追加案が必要。形式は版、出典施設ID、施設内項目ID/出展回ID、記録時の資料版を保持し、既存 `pavilion_id` は実在する親施設UUIDのまま。全283回を施設マスターに入れない。DDLレビューは `green-expo-place-context.ddl.review.sql`。現在のアプリはこの列を読み書きしない。
3. 施設追加前にローカルイベント対応を有効化し、既存11件を含む過去記録の表示・編集互換性、全施設SELECT利用箇所のスコープを検証する必要がある。単にseedを実行すると全施設一覧の分母へ新施設が混在し得るため、現状で実行しない。

検証計画: 追加前にUUID/名前重複・イベント存在・既存列定義を読み取り再確認、トランザクションで追加件数192と既存11件不変を照合。親施設FKと来場日の組合せをサーバー側で検証し、追加列なしの既存環境でも現在の保存を維持する。明示承認後にのみ最小の区別できるテスト記録で新規→再閲覧→編集/失敗再試行を確認する。既存写真や個人記録は変更しない。RLS/GRANT/Auth/Storageの変更はこの案に含めない。

戻し方: 追加列を直ちにdropせず旧コードから無視できるnullable列として保持。新施設も参照ができた後は削除しない。既存データを巻き戻す操作を行わない。現在 `visit_sessions` に `UNIQUE(visit_date)` が残るため同日の別イベントは保存できない。今回その制約の削除は提案・実行しない。

**未完了:** 実DB登録、出展回コンテキストの保存実装と承認後の実書込み検証、正式図面からレビュー済みイラストアンカーへの対応、実端末カメラ・実位置許可の動作確認。静的/モック検証を実機・実DBの完了と扱わない。commit/push/公開はしていない。PNGダウンロード・localhostアップロードの承認ループは再試行しない。

### 追加前の互換性監査結果（2026-10-25、上記の192行追加案は保留）

**結論: 192行を今そのまま追加する承認は依頼しない。** 追加案は適用可能なseedではなく候補のレビュー一覧。実DBで実行した変更は0行・0列・0権限。SQLは空行ガード/明示例外で停止するまま保持。

- 実DB `public.pavilions` をinactiveも含め全件SELECT済み。11件すべてactive、official_nameはnameと同じ、aliasesは全件空、spot_idは全件NULL。ASEAN、アメリカ館、イギリス館、インドネシア館、カナダ、シンガポールピンバッジ、テストパビリオン、はじめての訪問、ベトナム館、大阪パビリオン、庭園パビリオン。既存マスターには今回の出典IDや位置の根拠がなく、公開資料に基づく同一施設への一致は0件。名前の印象からテスト不要データとも判定しない。TEAM OSAKAと大阪パビリオンは統合しない。国名も国別参加表明だけでは施設にしない。
- 192は**176掲載区画候補＋補足の既定16施設候補**。176は175出展者名で、サカタのタネの掲載点が2区画にある。企業単位に統合も、同じ施設だと断定もせず出典版/ページ/番号別に区別。番号点は入口や区画ポリゴンではない。公式177との差1、区画名競合3件、145点の基準三角形外推定が残り、制覇対象数として確定していない。
- 補足52項目には親子7項目を含む。日本生命植物園→ねっこ、クラフト館A→クラフト館、日本政府苑イベントスペース/令和日本の庭→日本政府苑、スポット展示→かながわ館、アドベンチャーガーデン/こもれび広場→キッズガーデン。子項目は192行案には追加していない。親UUID＋子の出典IDを記録コンテキストで保持する案。親が未登録なら子だけ保存可能にしない。
- 根拠付きcrosswalk2件（はなめぐり、クラフト館）は元資料の同施設表記を一つにしたもの。現DB11件への対応根拠ではない。屋内283回は親のはなめぐりUUID＋出展回IDで保存する案で、283施設を作らない。

`tests/green-expo-compatibility.test.cjs` で実際の集計/スコープ関数を合成データで実行:

1. bare seed相当では `getPavilionProgressSummary()` の総数が11→203、訪問件数不変なのに未訪問が192増加。ホーム/未訪問一覧への混入を確認。`listPavilions()` はイベント非対応の全active取得。従来地図のエリア進捗も渡された施設数を分母にする。
2. 新イベントregistryだけ有効化すると既存11件がイベントの入力選択肢から全件外れる。一方、未分類画面では11件が残る。新規192件は未分類から除外できるが、既存記録のイベント/施設同一性を勝手に確定して解決してはいけない。
3. 記録ログ自体は書換え/削除されず、イベント別履歴と未分類/場所なし記録は保持。写真参照も変更なし。ただし履歴保持だけでは入力互換性の合格とはしない。

適用前に必要なローカル修正: 一覧・進捗の全呼出しをイベント別の同一スコープへ統一し、旧11件を「出典未照合の既存施設」として再選択/編集可能に保護する。旧施設を公式達成分母へ混ぜず、公式側も176番号点を192施設制覇と呼ばない。登録単位/訪問対象の確定とスコープ修正の回帰テストが終わるまで、承認可能な施設追加件数は**未確定**（候補行192、適用件数0）。

`place_context` の具体案: nullable JSON object、許可キーは `version:1`, `event_id`, `source_catalog_version`, `source_place_id`, `subplace_source_id:null|string`, `indoor_occurrence_id:null|string`。親施設の実在UUIDは既存pavilion_idで保持。サーバーで利用者/来場日所有、イベント一致、出典版、UUID対応、子の親一致、出展回の親と来場日期間、7日間未確定の扱い、サイズ上限/未知キー拒否を検証する必要がある。現在DDLのobject/version CHECKのみではこの検証は未完成。来場日変更/場所変更時は矛盾したコンテキストを維持しない。既存NULLはそのまま編集可能にする。

**位置情報の非保存範囲:** 新コンテキストに個人の緯度経度/精度/位置取得時刻/住所/写真EXIFを入れない。現在地/読み取った写真GPSは端末メモリ内で候補検索に使い、DB・分析ログへ送らない。ただし既存写真アップロードは元FileをStorageへ送る経路でEXIF除去がないため、「写真を含め個人GPSが絶対保存されない」とは現状では言えない。将来の保存フローで撮影位置を非保存と保証するには、新規写真のメタデータ除去/検証が別途必要。既存保存写真の一括加工はしない。

DB変更案が確定した場合の範囲: 施設行は確定後の新規件数のみ、activity_logsはnullable列1＋CHECK制約1、既存行更新0、削除0、RLS/policy/GRANT/Auth/Storage設定変更0。新publicマスター行は既存SELECT権限の利用者に見えるため表示影響はある。失敗はトランザクション全体rollback、適用済後のアプリ失敗時は旧コードへ戻してnullable列を無視する。記録から参照された施設は削除せず、既存データ/写真を壊す巻戻しはしない。今回はDBへの試行・拒否・不確実な書込み結果はなく、すべて未実行。

### ローカル互換性修正（上記の不具合を修正、DB未適用）

- `placeRegistry.pendingPavilionIds` にレビュー案192UUIDを隔離。仮に行だけが追加されても、registry未有効時は入力候補/未分類一覧/ホーム分母に混ざらない。正式なレビュー済みbindingを有効にした行だけ、そのイベントで選べる。
- 出典未照合の旧施設は `isLegacyPavilion` で区別し、台帳有効化前後とも入力/編集可能。これは施設をイベントへ割り当てる処理ではない。既存ログのevent_idは保持し、記録のイベント別画面と旧施設の未分類ビューから見返せる。場所なし/削除済み参照も消さない。
- ホームは選択イベントで来場日・カテゴリ件数・訪問を絞り込む。公式イベントの総数/未訪問/達成率は、source identityとは別の `completionEligible:true` が明示された対象だけ。未承認の176番号点＋16候補は0対象/達成率未確定。旧施設への訪問は件数に保持し、公式分母外の訪問と分ける。未分類の既存一覧は従来11件の範囲を維持。
- 回帰確認: registry未有効で旧11＋候補192を渡しても総数11/未訪問数不変。有効化後も旧11を選択可、他イベント候補192は除外。合成2イベント混在データで対象2・訪問済み対象1・50%を確認し、別イベントの訪問を混ぜない。旧11の出典bindingを生成したりDB値を書き換えたりしない。
- これはアプリ側の互換性修正であり、192区画候補の施設同一性や境界が確定したという意味ではない。施設追加案/DDLは引き続き未適用。全画面の改訂コードを公開する前に行だけ適用しない。

### 写真GPSの保持/除去の設計確認（保存仕様は変更していない）

確認した実装: `uploadActivityPhoto` は元Fileを `.upload(photoPath,file)` に渡す。カメラ/選択写真の位置解析は端末内で行い、現在地と区別。今回の保存payload/ログに緯度経度を追加していない。本人用原画像の既存EXIF保持はそのままなので、GPS非保存を保証しない。

除去案の比較:

- JPEGのEXIF領域を単に削除するとOrientationも消え、縦写真の向きが変わり得る。GPSだけの書換えもTIFF参照/サムネイル/他メタデータを誤って壊さない検証が必要。安易なバイト削除は採用しない。
- 表示時の向きを適用してCanvasへ描画し派生画像を再エンコードする案は、共有用画像のみに使えば本人用原画像を維持できる。ただしJPEG画質/ICC色/透過/巨大画像メモリ、HEIC対応、機種別の向き処理を検証する必要がある。写真保存の全面変換を今回勝手に導入しない。
- 現在の地図PNGは既存Canvas描画を新規PNG化する経路で、元JPEG/EXIFを添付する処理やGPSテキスト描画はない。コード上の経路は確認したが、実出力バイナリの全メタデータ検査は未実施。ダウンロード承認ループを再試行して確認済みと装わない。
- 共有前の最低検証案: 合成GPS EXIF・Orientation1/3/6/8のダミーJPEGを用意し、表示と派生共有画像の方向/寸法/色/画質を比較し、派生PNG/JPEGを独立パーサーでGPS/EXIF/XMP/IPTCがないか検査。本人写真を外部送信しない。元ファイルは保持。現在地座標/取得時刻も共有caption/JSON/ログに含めない。現段階で共有機能や公開範囲は拡張しない。

DB差分は依然0行/0列/0RLS/0GRANT。アプリの互換性はローカル合成データ/モックで検証済みだが、未承認の実DB適用後の実保存・再閲覧まで検証済みとは言わない。施設行追加の確定件数はsource identity/登録単位のレビュー待ち。nullable列案1＋CHECK1も未実行。現在のUNIQUE(visit_date)等の制約は変更しない。

最終確認: ホームの重複読取りを除去して取得済みデータを再利用。最初の実画面確認では認証トークン並行更新409が出たが、修正後に再起動した同じ3001番で正常表示を確認。未分類→GREEN×EXPO→未分類への切替、公式達成対象未確定表示、既存集計復帰を非書込みで確認した。認証設定/セッション削除等は行っていない。実ホームのモックテストでも各データ取得1回を確認。実保存・施設追加後の本番相当検証は未実施のまま。

### 現在の登録提案・公開順序（2026-10-25、以前の192行案を置換）

基本単位は「公式資料の掲載箇所で区別できる場所/区画」。出展者の企業数や建物数とは同じでない。source IDは公式発行の永続IDではなく、版/頁/番号/公式名称を指すアプリ内部参照。将来版との同一性は再レビューする。区画境界や入口位置の確定は登録の条件と混同せず、推定座標は候補検索だけに使う。達成対象フラグは全件falseのまま。

全228行の判定・根拠URL・親・提案UUIDは `green-expo-registration.audit.review.json`。

- **登録案216 places = 屋外173区画 + 補足43場所**。`green-expo-facilities.rows.review.json` に正確なUUID/名称/出典を収録。全件is_active=false。GPS候補189（屋外173＋補足16）、手動選択のみ27（旧位置図9を含み、旧座標をGPSに流用しない）。位置未デジタイズだけを理由に、識別できる館/庭園/広場を登録不能にはしない。
- 同じ出展者のサカタのタネは `flower-20261009-p07-05` と `flower-20261009-p10-01` の掲載区画を分ける。日本語表示名には図面頁・番号を添えて区別し、企業名だけで統合しない。source IDをそのままUI名にしない。
- **保留3区画**: `flower-20261009-p05-11`（横浜植木）、`flower-20261009-p05-12`（TEAM OSAKA）、`flower-20261009-p12-01`（東北ガーデンプロジェクト）。同日公開の図面とリストで庭の区画ラベルが競合。候補マスター追加/GPS候補から外し、資料の手動参照に残す。
- **保留2サービス**: `service-baby`, `service-accessibility`。FAQで名称は確認できるが箇所数/個別の物理拠点を確認できない。1施設だと決めない。医療3施設は資料に中央部/メインゲート横/SATOYAMA Villageの区別があるため、位置未デジタイズの手動場所として登録案へ含める。`gate-main`はFAQの1か所予定を根拠とした予定場所で、確定入口座標とは扱わない。
- **親コンテキスト7項目**: `partner-nissay`→`organizer-nekko`; `craft-a`→`organizer-craft`; `government-event-space`,`government-reiwa-garden`→`government-japan`; `kanagawa-spot`→`host-kanagawa`; `expo2027-organizer-adventure-garden`,`expo2027-organizer-komorebi-plaza`→`expo2027-organizer-kids-garden`。独立マスターを作らず、親UUID＋子source IDを保持する設計。
- はなめぐり/クラフト館の同場所crosswalk2件は正規化台帳で既に統合しており、カテゴリごとの重複行を作らない。全GPS既定点に2m未満の座標重複なし（同一性の証明ではない）。名前や近さだけで別候補を統合しない。既存11への根拠付き一致は0で、更新しない。屋内283回ははなめぐり親の出展回コンテキスト、参加国80は場所にしない。

#### 最小構成の比較と推奨

1. **既存pavilionsへinactiveで追加（推奨）**: 新テーブル/イベント列不要。現在のlistPavilionsはis_active=trueだけを表示し、保存側もinactiveを拒否する（新規/編集を実関数モックで検証済み）。事前追加で既存11件の公開UIを変えない。正式有効化には互換コードの公開が必須。inactiveのまま本物の保存を通す例外は作らない。
2. event_id列をpavilionsへ追加: DB上の所属は明確になるが、既存11のNULL扱い・全クエリ/FK/マルチイベント共用場所を検討する追加DDLが必要。今回のsource→UUIDのイベント対応と旧施設互換性はローカルregistryで保てるため採用しない。
3. 別placeテーブル: 意味は明確だが既存activity_logs.pavilion_idのFKをそのまま使えず、二重参照・JOIN・旧データ移行/互換層が必要。今回は採用しない。

#### 承認対象の具体案と順序（未承認・未実行）

対象 project `xavnxklqsupkosmywojn`、イベント `e60f2360-8147-4112-969a-00954596ceb6`。

A. 事前DB準備: 216新規行を `public.pavilions(id,name,official_name,is_active=false)` にINSERT。既存11の更新/削除0。合計行数は11→227、activeは11のまま。`public.activity_logs` はnullable `place_context jsonb` 1列＋object/version CHECK1制約を追加案。既存記録はNULLで保持、バックフィル0。DDLは適用前に既存定義を再SELECTし、Supabase正式migration手順で行う（reviewファイルをdb pushしない）。RLS/GRANT/Auth/Storage設定変更0。publicマスターの行は既存SELECT権限で直接取得可能だが、現UIはactive条件で非表示。

B. アプリ準備・公開: コンテキストのサーバー検証/保存/編集/再閲覧、216 source→UUID binding（全completionEligible=false）、イベントスコープ、旧11互換性、保存失敗/二重送信/戻る等の全検証を完了してから、明示承認されたcommitだけmain push・既存Vercel自動公開。現時点ではコンテキスト保存実装が未完なので、まだ公開を実行できる状態ではない。単にDB列を追加しても保存完了とはしない。

C. 公開commit/READY/非書込み画面を確認後、216提案UUIDだけをis_active false→trueへUPDATE。旧11は対象外。`green-expo-facilities.activate.review.sql` はその対象と件数を検証する未実行雛形で、承認ID空・公開確認false・rollbackのまま。保留5を有効化しない。ブラウザ古いフォーム/旧ルートの互換性も確認。未知の独立クライアントへの表示は変わるため行追加の公開影響として明示する。

D. 実書込み検証は別途許可された最小ダミー記録のみ。現在は合成データ/モックの保存と再閲覧で検証し、本番レコードを作らない。許可を得る場合は専用印付き来場日1件＋訪問/フード/グッズ等の必要件数・写真の有無を事前確定し、既存日付と衝突時に既存行を変更しない。PNGダウンロード/localhost uploadの停止済み操作は再発行しない。

失敗時: Aはトランザクション全体rollback。A成功後B未達ならinactiveのまま保持でき、既存UI/記録は維持。C失敗は全件rollbackし、結果をSELECTしてから再判断。C成功後の不具合は公開アプリを互換版で停止/修正し、参照された場所・コンテキスト列や既存写真を削除する巻戻しはしない。追加費用/新環境/新資格情報はこの案に含まない。

**保証の限界**: 現地座標/入口/境界の測量保証なし、原写真EXIF GPS除去は未実装、共有PNGの実バイナリ全メタデータ検査は未実施。本人用原画像の既存保存挙動は変更していない。現在の実DB変更/実記録書込み/commit/push/公開はすべて0。

事前スキーマ再確認（read-only）: public.pavilionsはid/name/is_active/sort_order/created_at/updated_atがNOT NULL。sort_order=0、日時now()の既定値があるため提案4列のINSERTと整合。is_active既定trueなので、事前追加ではfalseを必ず明示する。place_context列はまだ存在しない。pavilionsのtriggerは取得結果0、activity_logsには既存の写真参照保護triggerがあるため維持。SQL実行やtrigger変更は行っていない。最終全96テスト・lint・型検査・build成功。レビュー案はすべて未適用。

### 適用済みの準備と最新ローカル実装（2026-10-25）

ユーザーの限定承認により、project xavnxklqsupkosmywojn にmigration `20261025151259_green_expo_inactive_places_and_optional_context` をトランザクションで適用済み。216 placesは全件inactive、総数227/active11、新規active0。既存11施設の全値と55記録の既存全列の指紋は前後一致、全55件のplace_contextはNULL。publicテーブルACL/RLS強制フラグ/policy定義の指紋も前後一致。写真内容の読取りや変更なし。検証結果は `green-expo-preparation.verification.json`。過去review SQLは誤再実行を避けるため引き続き停止ガード付き。migration履歴repair/db pushはしていない。

適用SQLの正本は `migrations/20261025151259_green_expo_inactive_places_and_optional_context.sql` に保存。これは既存DBのデータ指紋を事前条件とした今回の適用記録であり、空DBでの再構築実行は未検証。過去migrationにも実DBとの履歴差があり、再構築時に機械的なdb reset/repairを行わない。

ローカルのplace_context機能: schema準備済みフラグtrueで任意列をSELECT/保存payloadへ接続。216 bindingは出典URL付きで準備したが `greenExpoBindingsEnabled=false` のまま、inactive施設は表示/保存対象にならない。既存NULL記録はそのまま扱う。作成→ラベル再閲覧→編集時保持/明示取消、親子整合/イベント/出典版/出展期間/未知キー・GPSキー拒否、旧列非対応モード、失敗時入力保持/種別切替/下書き復元/場所変更時解除を非接続モックで検証。タイトルやメモにsource IDを埋め込まない。来場日/所有者の既存検証とinactive拒否を維持。実記録のテスト保存はしていない。

写真メタデータ: 合成GPS JPEGのOrientation1/3/6/8を色分けパターンで作り、独立Pillow方式で向きを画素へ適用した派生PNGの寸法/方向/メタデータなしを確認。レポートはPC Tempの `bloomlog-metadata-check-20261025/report.json`。これは除去方式の実現性確認でありアプリ本来のCanvas PNG実出力の検証ではない。現書出し背景memory-garden-v1.pngにGPS/EXIFはなかった。原写真の既存アップロード挙動は変更せずEXIF GPSが残り得る。停止済みのlocalhostアップロード/PNGダウンロード操作を再発行していない。

未承認のため実行していないもの: 216施設の有効化、実記録保存、commit/push、公開。これらは今回の準備承認に含まれない。保存フロー全体の実利用完了とはまだ扱わない。

実画面の最終read-only確認: 最終ビルドをlocalhost:3001で起動し、任意列を読むホームが正常表示。未分類の総数11・訪問済み8の既存表示を維持。入力の場所一覧は空選択1＋既存11の計12 optionsで、新216件は出ていない。保存/アップロード/有効化はクリックしていない。全105テスト・lint・型検査・build成功、HEAD217430fのまま。
