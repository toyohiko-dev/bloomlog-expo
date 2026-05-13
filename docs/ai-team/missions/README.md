# Historical Mission Records

この directory は AI Team experiment era の Mission records を保持する場所である。

通常の Codex 開発では、ここを入口にしない。

## 扱い

- 既存 Mission は履歴資料として読む。
- `completed` / `superseded` の Mission を再開しない。
- 新規開発タスクのために Mission lifecycle を前提にしない。
- 必要な判断材料がある場合だけ、read-only で参照する。

## 現在の通常開発

- 作業ルール: root `AGENTS.md` と domain `AGENTS.md`
- UI / frontend: `app/AGENTS.md`
- DB / migration / RLS: `supabase/AGENTS.md`
- プロダクト仕様: `docs/product/`
