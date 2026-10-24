import type { ActivityLog, PavilionOption, VisitSession } from "./session-shared";

/** Explicit, in-memory preview only. Never passed to a write action. */
export function createMemoryMapDemo(pavilions: PavilionOption[]) {
  const sessions: VisitSession[] = ['2027-04-10', '2027-05-12'].map((visit_date, i) => ({ id: `demo-day-${i}`, visit_date, title: 'サンプル来場日', memo: null, user_id: 'demo', event_id: null, created_at: '2027-05-12T00:00:00Z' }));
  const logs: ActivityLog[] = [];
  const add = (session: number, type: string, title: string, place: number | null) => {
    const pavilion = place === null ? null : pavilions[place] ?? null;
    logs.push({ id: `demo-record-${logs.length}`, session_id: sessions[session].id, user_id: 'demo', event_id: null,
      created_at: '2027-05-12T00:00:00Z', occurred_at: null, title, memo: '保存しないデモデータ', activity_type: type,
      price: null, acquisition_method: type === 'pin' ? 'purchase' : null, photo_path: null,
      pavilion_id: pavilion?.id ?? null, pavilion });
  };
  add(0, 'pavilion_visit', pavilions[0]?.name ?? 'サンプル場所', 0);
  for (let i = 0; i < 4; i++) add(0, 'food', `フードの思い出 ${i + 1}`, 0);
  add(1, 'pavilion_visit', pavilions[0]?.name ?? 'サンプル場所', 0);
  for (let i = 0; i < 2; i++) add(1, 'food', `翌月のフード ${i + 1}`, 0);
  add(1, 'pin', '関連グッズだけの記録', 1);
  add(1, 'event_participation', '場所は後で決める思い出', null);
  return { sessions, logs };
}
