# Decision Log: Copy / CTA / Page Title / Terminology Audit

## 2026-05-10

- 決定者: Human / Parent Agent
- 決定内容: Bloomlog の文言、CTA、ページタイトル、用語ゆれを read-only で監査する Mission を作成する。
- 選ばなかった案: アプリ本体を直接修正する。文言監査を chat だけで進める。Human に Agent 間の転記を依頼する。
- 根拠: repo-first autonomous AI team 運用を試すため、Mission artifact を正本にする必要がある。
- 影響範囲: `docs/ai-team/missions/mission-20260510-copy-terminology-audit/` のみ。
- approval gate: 不要。docs-only setup と read-only audit のため。
- 後で見直す条件: 文言修正が必要になった場合、code branch + PR path または product decision Mission に切り出す。
