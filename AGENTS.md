<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes - APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Bloomlog AGENTS

## 基本方針

- Bloomlog はイベント体験を「来場日」単位で記録し、「思い出」として振り返るアプリである。
- 日本語 UI を前提とする。
- `docs/product/` をプロダクト仕様の正本として扱う。
- まず既存仕様、既存構造、既存用語を確認し、最小変更で対応する。
- 新しい運用フォルダや独自の AI 組織構造は、明示依頼がない限り追加しない。

## Domain Rules

作業対象に応じて、近い階層の `AGENTS.md` も読む。

- UI / UX / frontend / route / component / copy: `app/AGENTS.md`
- DB / migration / RLS / policy / Supabase: `supabase/AGENTS.md`
- product spec: `docs/product/`
- AI 運用や過去の作業ログ: `docs/ai-team/` は必要な場合だけ参照する。通常開発の入口にはしない。

## 固定用語

以下の用語は勝手に変更しない。

- 来場日
- 思い出
- 思い出アルバム
- タイムライン
- 記録

禁止:

- 上記用語の英語化。
- 既存日本語用語の独自言い換え。
- UI 文言の無断変更。

## 禁止事項

明示依頼または承認なしに、次を行わない。

- migration 作成。
- webhook 作成。
- cron 作成。
- Gmail API 追加。
- Apps Script 追加。
- `service_role` / admin client 追加。
- ops dashboard 作成。
- notification inbox 作成。
- app router、route、page、component の大量追加。
- `package.json` の不要変更。
- 本番 DB write。
- destructive SQL。
- secret / token / env の作成、更新、削除。
- Supabase / Vercel / GitHub などの dashboard 設定変更。

## 承認 Gate

次は実行直前で止まり、人間承認を得る。

- 本番 DB write。
- destructive SQL。
- `db push`。
- migration repair。
- migration の本番適用。
- secret / token / env / OAuth secret 変更。
- dashboard 設定変更。
- 課金、ドメイン、認証 provider、redirect URL など実運用に影響する設定変更。

承認前に、対象、影響、リスク、rollback、検証方法を短く整理する。

## Codex の進め方

- 依頼内容を repo の現状に照らして確認する。
- 必要なら短い plan を出す。
- 実装は既存ファイルの責務に沿って小さく行う。
- 調査が広い場合は read-only で確認し、必要に応じて Codex の subagent を実行時に使う。
- subagent 用の永続的な組織フォルダや role docs は作らない。
- lint、build、test など実行できる検証は実行する。実行できない場合は理由を報告する。

## 報告

- 日本語で説明する。
- 変更したファイル一覧を報告する。
- なぜ必要か、どこまで変えたか、何を変えていないかを簡潔に説明する。
- 実装時は root cause を書く。
