import { activityTypeOptions } from "./activity-types";
import { getActivityLogTitle, type ActivityLog } from "./session-shared";

type ReflectionLog = Pick<ActivityLog,
  "id" | "session_id" | "activity_type" | "title" | "pavilion" | "occurred_at" | "created_at"
>;

function timestamp(value: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

function compactName(value: string) {
  const glyphs = Array.from(value.replace(/\s+/g, " ").trim());
  return glyphs.length > 28 ? glyphs.slice(0, 27).join("") + "…" : glyphs.join("");
}

/** A factual reflection from saved records; never infers feelings or rewrites a user's title. */
export function buildVisitDayReflection(logs: ReflectionLog[]) {
  if (!logs.length) {
    return { title: "これから思い出を記録する日", description: "まだ思い出はありません。記録すると、この日の内容がここにまとまります。", count: 0 };
  }
  const ordered = [...logs].sort((a, b) => {
    const timeA = timestamp(a.occurred_at), timeB = timestamp(b.occurred_at);
    if (timeA !== timeB) return timeA < timeB ? -1 : 1;
    const createdA = timestamp(a.created_at), createdB = timestamp(b.created_at);
    if (createdA !== createdB) return createdA < createdB ? -1 : 1;
    return a.id.localeCompare(b.id);
  });
  const groups = activityTypeOptions.flatMap((option) => {
    const items = ordered.filter((log) => log.activity_type === option.value);
    if (!items.length) return [];
    const names = [...new Set(items.map((log) =>
      (getActivityLogTitle(log) ?? "").replace(/\s+/g, " ").trim(),
    ).filter(Boolean))];
    const displayed = names.slice(0, 2).map(compactName).join("、");
    return [{ label: option.label, count: items.length, names,
      sentence: displayed
        ? `${option.label}：${displayed}${names.length > 2 ? "など" : ""}（${items.length}件）`
        : `${option.label}：${items.length}件（名称未設定）`,
    }];
  });
  const knownCount = groups.reduce((sum, group) => sum + group.count, 0);
  const descriptions = groups.map((group) => group.sentence);
  if (knownCount < logs.length) descriptions.push(`その他の記録：${logs.length - knownCount}件`);

  let title = `${logs.length}件の思い出を記録した日`;
  if (groups.length === 1 && knownCount === logs.length) {
    const group = groups[0];
    title = group.names.length === 1
      ? `${compactName(group.names[0])}の思い出`
      : `${group.label}の思い出を記録した日`;
  } else if (groups.length === 2 && knownCount === logs.length) {
    title = `${groups.map((group) => group.label).join("と")}を記録した日`;
  } else if (groups.length > 2 && knownCount === logs.length) {
    title = `${groups.length}種類の思い出を記録した日`;
  }
  return { title, description: descriptions.join("。") + "。", count: logs.length };
}

export function buildVisitDayReflections(logs: ReflectionLog[]) {
  const grouped = new Map<string, ReflectionLog[]>();
  for (const log of logs) {
    const group = grouped.get(log.session_id) ?? [];
    group.push(log); grouped.set(log.session_id, group);
  }
  return new Map([...grouped].map(([id, group]) => [id, buildVisitDayReflection(group)]));
}
