# AI Team Experiment Era Archive

この directory は、過去の AI Team experiment era の資料を保持する場所である。

通常の Codex 開発では、ここを入口にしない。

## 通常開発で読むもの

- repo 全体: `AGENTS.md`
- UI / UX / frontend: `app/AGENTS.md`
- DB / migration / RLS / Supabase: `supabase/AGENTS.md`
- プロダクト仕様: `docs/product/`

## この directory の扱い

- Mission、Report、Decision Log、notification intake、DB 調査ログなどの履歴資料として扱う。
- `completed` / `superseded` の Mission を再開しない。
- 新規開発タスクのために、この directory の運用モデルを前提にしない。
- 必要な判断材料がある場合だけ、read-only で参照する。

## 今後の整理方針

- 削除や大量移動は急がない。
- 通常開発に必要なルールは `AGENTS.md` と domain `AGENTS.md` に寄せる。
- プロダクト仕様として残すべき内容だけ `docs/product/` に反映する。
- 履歴価値だけの資料は、必要に応じて `docs/archive/` へ退避する。
