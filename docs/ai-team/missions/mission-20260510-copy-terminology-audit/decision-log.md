# Decision Log: Copy / CTA / Page Title / Terminology Audit

## 2026-05-10

- 決定者: Human / Parent Agent
- 決定内容: Bloomlog の文言、CTA、ページタイトル、用語ゆれを read-only で監査する Mission を作成する。
- 選ばなかった案: アプリ本体を直接修正する。文言監査を chat だけで進める。Human に Agent 間の転記を依頼する。
- 根拠: repo-first autonomous AI team 運用を試すため、Mission artifact を正本にする必要がある。
- 影響範囲: `docs/ai-team/missions/mission-20260510-copy-terminology-audit/` のみ。
- approval gate: 不要。docs-only setup と read-only audit のため。
- 後で見直す条件: 文言修正が必要になった場合、code branch + PR path または product decision Mission に切り出す。

## 2026-05-10 Finalization

- 決定者: Parent Agent
- 決定内容: Mission を `completed` として finalize する。
- 選ばなかった案: この Mission 内で UI 文言を直接修正する。Writer / Reviewer / QA の findings を chat で再転記する。未実装 follow-up があるため `blocked` にする。
- 根拠: Writer / Reviewer / QA reports が揃い、docs-only safe path と report completeness が確認された。文言修正はこの Mission の非目的であり、follow-up code-pr または product-decision に切り出すべきである。
- 影響範囲: `docs/ai-team/missions/mission-20260510-copy-terminology-audit/` の Mission state、Parent Summary、Decision Log。
- approval gate: 不要。app / lib / supabase / migrations / package / env は変更していない。
- 残リスク: 実際の UI copy fixes は未実装。ブランド表記、fallback 文言、CTA 方針は product decision が必要。
- 次 action: obvious collection copy fixes を code-pr follow-up に切り出し、brand casing / fallback wording / date CTA は product-decision follow-up に切り出す。
