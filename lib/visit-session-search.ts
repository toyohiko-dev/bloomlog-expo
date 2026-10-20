import { activityTypeOptions } from "./activity-types";
import type { ActivityLog, VisitSession } from "./session-shared";

type QueryValue = string | string[] | undefined;
export type VisitSessionSearchParams = { q?: QueryValue; from?: QueryValue; to?: QueryValue };

function first(value: QueryValue) {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function readVisitSessionSearch(params: VisitSessionSearchParams = {}) {
  const query = first(params.q).trim().slice(0, 200);
  const from = first(params.from).trim();
  const to = first(params.to).trim();
  let error = "";
  if ((from && !validDate(from)) || (to && !validDate(to))) {
    error = "期間には正しい日付を指定してください。";
  } else if (from && to && from > to) {
    error = "開始日は終了日以前の日付を指定してください。";
  }
  return { query, from, to, error };
}

function normalize(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("ja-JP");
}

export function filterVisitSessions(
  sessions: VisitSession[],
  logs: Pick<ActivityLog, "session_id" | "title" | "memo" | "activity_type" | "pavilion">[],
  filters: ReturnType<typeof readVisitSessionSearch>,
) {
  if (filters.error) return [];
  const terms = normalize(filters.query).split(/\s+/).filter(Boolean);
  const contents = new Map<string, string[]>();
  if (terms.length) {
    for (const log of logs) {
      const values = contents.get(log.session_id) ?? [];
      values.push(log.title ?? "", log.memo ?? "", log.pavilion?.name ?? "", log.pavilion?.official_name ?? "",
        activityTypeOptions.find((option) => option.value === log.activity_type)?.label ?? "");
      contents.set(log.session_id, values);
    }
  }
  return sessions.filter((session) => {
    if (filters.from && session.visit_date < filters.from) return false;
    if (filters.to && session.visit_date > filters.to) return false;
    if (!terms.length) return true;
    const [year, month, day] = session.visit_date.split("-");
    const searchable = normalize([
      session.title, session.memo, session.visit_date,
      `${year}/${month}/${day}`, `${year}/${Number(month)}/${Number(day)}`,
      `${year}年${Number(month)}月${Number(day)}日`,
      ...(contents.get(session.id) ?? []),
    ].join(" "));
    return terms.every((term) => searchable.includes(term));
  });
}
