# Parent Summary Report

## mission id

`mission-20260509-supabase-migration-history`

## task id

`task-001-parent-integration`

## agent role

Parent Agent

## summary

DB Inspector / Reviewer / QA reports を統合した。remote migration history は空または欠落して見えるが、問題は `history-only drift` ではなく `migration history drift + partial schema drift` と判断する。

現時点では `npx supabase db push`、`npx supabase migration repair`、個別 production SQL のいずれにも進まない。`approval-needed.md` は executable approval request ではなく、次の調査で候補を絞るための pending gate として更新する。

## input files read

- `docs/ai-team/missions/mission-20260509-supabase-migration-history/mission.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/parent.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/db-inspector.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/reviewer.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/qa.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/reviewer-report.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/qa-report.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`

## output files changed

- `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/parent-summary.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md`
- `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`

## commands run

```powershell
Get-ChildItem docs\ai-team\missions\mission-20260509-supabase-migration-history\reports -File | Sort-Object Name | Select-Object -ExpandProperty FullName
git status --short --branch
Get-Content -Raw -Encoding UTF8 docs\ai-team\missions\mission-20260509-supabase-migration-history\mission.md
Get-Content -Raw -Encoding UTF8 docs\ai-team\missions\mission-20260509-supabase-migration-history\approval-needed.md
Get-Content -Raw -Encoding UTF8 docs\ai-team\missions\mission-20260509-supabase-migration-history\reports\db-inspector-report.md
Get-Content -Raw -Encoding UTF8 docs\ai-team\missions\mission-20260509-supabase-migration-history\reports\reviewer-report.md
Get-Content -Raw -Encoding UTF8 docs\ai-team\missions\mission-20260509-supabase-migration-history\reports\qa-report.md
Get-Content -Raw -Encoding UTF8 docs\ai-team\missions\mission-20260509-supabase-migration-history\decision-log.md
```

## integrated findings

### Remote migration history

- `npx.cmd supabase migration list` では local 10 migration が見える一方、remote 列は空。
- remote DB に `supabase_migrations` schema は見えない。
- migration 関連 table として `auth.schema_migrations`、`realtime.schema_migrations`、`storage.migrations` は見えるが、repo migration history ではない。

判断:

- remote migration history drift は確認済み。
- `db push` は local 全 migration を未適用として扱う可能性が高いため、今は使わない。

### Remote schema

repo migration の主要成果物は多く存在する。

- `activity_logs.occurred_at` nullable。
- `activity_logs.pavilion_id`、`activity_logs.user_id`、`activity_logs.photo_path` が存在。
- `pavilions`、`pavilion_aliases`、`profiles` が存在。
- `profiles.display_name` は存在し、`profiles.nickname` は存在しない。
- `activity-photos` bucket は存在し public true。
- `activity_logs` / `visit_sessions` insert own policy は `authenticated` に限定されている。

一方で schema drift も確認済み。

- `public.assign_visit_session_user_id` が見えない。
- `public.sync_activity_log_user_id` が見えない。
- `set_visit_session_user_id` trigger が見えない。
- `set_activity_log_user_id` trigger が見えない。
- repo expectation の user_id 系 index 2 本が見えない。
- storage insert policy が repo expectation と異なる。
- `events`、`areas`、`countries`、`spots`、`pavilions.image_path` など repo migration 外の要素が remote に存在する。

判断:

- 現時点の分類は `history-only drift` ではない。
- `migration history drift + partial schema drift` として扱う。

## repair candidate integration

DB Inspector の repair candidate table は有効だが、現時点では execution-ready ではない。

Parent 判断:

- low risk 候補だけを部分 repair する判断はまだしない。
- `20260404235000_add_auth_to_visit_sessions_and_activity_logs.sql` は function / trigger / index drift があり、repair not ready。
- `20260405190000_add_activity_log_photo_path.sql` は storage insert policy drift があり、repair not ready。
- `20260508100000_fix_visit_sessions_and_activity_logs_rls.sql` は latest policy evidence はあるが、過去 migration drift の扱いに依存するため単独 repair しない。
- `20260405001000_fix_profiles_add_nickname_column.sql` は sequence-aware review が必要で、単体の final schema だけでは判断しない。

## `db push` judgment

`npx supabase db push` は不可。

理由:

- remote migration history が空表示。
- `supabase_migrations` schema が見えない。
- partial schema drift がある。
- remote-only schema が存在する。
- `db push` は production DB write で Human approval gate が必要。
- 今の状態で実行すると、全 migration の再適用、衝突、意図しない policy / schema 上書きのリスクがある。

## individual SQL judgment

個別 SQL 適用は今は未実行、未承認、未確定。

候補になりうるが、まだ approval request にできないもの:

- 欠落 function / trigger の再作成。
- 欠落 user_id 系 index の作成。
- storage insert policy の修正。

追加確認が必要な理由:

- 現行 app が `user_id` をどこで設定しているか未確認。
- function / trigger が意図的に削除された可能性がある。
- `activity_photos_insert_test` が一時 policy か現行運用 policy か未確認。
- remote-only schema を正式 schema として取り込む方針が未確定。

## validation

- validation performed:
  - DB Inspector が read-only CLI / SQL で remote migration history、schema、RLS、policy、trigger、function、index、constraint、storage を確認した。
  - Reviewer が docs-only safe path と approval gate を確認した。
  - QA が report required fields、read-only CLI 再現、approval-needed readiness を確認した。
- validation result:
  - reports は Mission の read-only 棚卸しとして十分。
  - `approval-needed.md` は pending gate として妥当。
  - executable approval request としては未完成。
- validation not performed:
  - DB write。
  - migration repair。
  - `db push`。
  - destructive SQL。
  - dashboard setting change。
  - secret / token inspection。
- reason:
  - Mission scope が read-only 棚卸しであり、write 操作は Human approval gate が必要なため。

## diff summary

- changed files:
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/db-inspector-report.md`
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/reviewer-report.md`
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/qa-report.md`
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/reports/parent-summary.md`
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/decision-log.md`
  - `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`
- docs-only: yes
- code change: no
- DB write: no
- migration file change: no
- approval gate candidate: yes, for future write only

## risks

- `db push` risk: high。remote history が空表示で partial schema drift があるため。
- `migration repair` risk: high for drifted migrations。履歴だけ整えて schema drift を隠す可能性がある。
- individual SQL risk: medium to high。現行 app / remote-only schema / storage policy の意図確認が未完了。
- process risk: approval-needed を executable approval と誤読すると危険。
- docs risk: low。今回の Parent 統合は docs-only。

## rollback

- rollback needed for this Parent integration: no
- rollback plan:
  - docs-only 変更を戻す場合は、この Mission 配下の Parent 統合差分だけを revert する。
- rollback not needed because:
  - DB write、migration repair、`db push`、destructive SQL、dashboard change、secret change を実行していない。

Future rollback notes:

- `migration repair`: 誤 repair 時は version を `reverted` として repair する案が必要。ただし実行前に Supabase CLI current behavior を再確認する。
- missing functions / triggers: `drop trigger if exists ...` / `drop function if exists ...` の rollback SQL を用意する。
- missing indexes: `drop index if exists ...` を用意する。concurrent / lock 方針は事前確認する。
- storage policy: 既存 policy 定義を保存し、policy gap が出ない順序で rollback SQL を用意する。
- `db push`: not safely reversible。今は候補にしない。

## unknowns

- linked project が Bloomlog production であることの最終確認。
- remote-only schema の作成経路。
- missing function / trigger / index が意図的な削除か drift か。
- `activity_photos_insert_test` が一時検証用か現行運用 policy か。
- `activity_logs_acquisition_method_check` の定義全文が repo と一致するか。
- Supabase CLI の migration history 初期化 / repair の現行推奨。

## approval required?

No for this Parent integration.

Yes before any future:

- migration repair
- `db push`
- individual production SQL
- destructive SQL
- production DB write
- dashboard setting change
- secret / environment variable change

## approval reason

- approval type: migration repair / db push / production write / destructive SQL / dashboard / secret
- reason: remote DB write または production 影響を伴うため。
- approval-needed file: `docs/ai-team/missions/mission-20260509-supabase-migration-history/approval-needed.md`

## decision

この Mission は read-only 棚卸しとして完了扱いにできる。ただし remediation 実行には進まない。

次の Mission / Task は `migration repair` 実行ではなく、drift の追加調査と remediation 候補の絞り込みを目的にする。

## next action

- Next agent to run: DB Inspector Agent
- Next task file path: `docs/ai-team/missions/mission-20260509-supabase-migration-history/tasks/db-inspector.md`
- Next task scope:
  - linked project の最終確認方法を secret なしで整理する。
  - missing function / trigger / index の意図を app code と remote schema の read-only evidence で確認する。
  - storage insert policy drift の意図を確認する。
  - `activity_logs_acquisition_method_check` の definition comparison を行う。
  - repair 可能な migration と repair してはいけない migration を再分類する。
  - 具体的な approval request は、候補を 1 つに絞れるまで pending のままにする。
