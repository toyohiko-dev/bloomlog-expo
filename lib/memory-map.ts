import type { ActivityLog, VisitSession } from "./session-shared";

export type MemoryEntry = Pick<ActivityLog, "id" | "session_id" | "activity_type" | "pavilion_id" | "title" | "occurred_at" | "created_at" | "photo_path">;
export type MemoryDay = { date: string | null; entries: MemoryEntry[] };
export type MemoryPlace = { id: string; visited: boolean; visitCount: number; days: MemoryDay[]; entries: MemoryEntry[] };

function orderEntries(a: MemoryEntry, b: MemoryEntry) {
  const timestamp = (entry: MemoryEntry) => {
    const value = Date.parse(entry.occurred_at ?? entry.created_at);
    return Number.isFinite(value) ? value : 0;
  };
  return timestamp(a) - timestamp(b) || a.id.localeCompare(b.id);
}

/** Calendar ownership comes from the visit day, never the upload date. No records are truncated. */
export function buildMemoryMap(entries: MemoryEntry[], sessions: Pick<VisitSession, "id" | "visit_date">[], date: string | null = null) {
  const dates = new Map(sessions.map(session => [session.id, session.visit_date]));
  const selected = entries.filter(entry => date === null || dates.get(entry.session_id) === date).slice().sort(orderEntries);
  const places = new Map<string, MemoryPlace>();
  const unplaced: MemoryEntry[] = [];
  for (const entry of selected) {
    if (!entry.pavilion_id) { unplaced.push(entry); continue; }
    let place = places.get(entry.pavilion_id);
    if (!place) {
      place = { id: entry.pavilion_id, visited: false, visitCount: 0, days: [], entries: [] };
      places.set(place.id, place);
    }
    place.entries.push(entry);
    if (entry.activity_type === "pavilion_visit") { place.visited = true; place.visitCount++; }
  }
  for (const place of places.values()) {
    const days = new Map<string | null, MemoryEntry[]>();
    for (const entry of place.entries) {
      const key = dates.get(entry.session_id) ?? null;
      const group = days.get(key) ?? []; group.push(entry); days.set(key, group);
    }
    place.days = Array.from(days, ([date, entries]) => ({ date, entries }))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }
  return {
    places: Array.from(places.values()).sort((a, b) => a.id.localeCompare(b.id)), unplaced,
    entries: selected,
    dates: Array.from(new Set(entries.map(entry => dates.get(entry.session_id)).filter((value): value is string => Boolean(value)))).sort().reverse(),
  };
}
