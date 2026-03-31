import Link from "next/link";
import { AppPrimaryNav } from "@/app/_components/app-primary-nav";
import { startSessionForDateAction } from "@/app/sessions/actions";
import { getActivityTypeMeta, neutralSummaryTone } from "@/lib/activity-types";
import {
  getPavilionProgressSummary,
  listCollectionActivityLogs,
  listSessions,
  todayDateString,
} from "@/lib/sessions";

export default async function HomePage() {
  const [sessions, experiences, pavilionProgress] = await Promise.all([
    listSessions(),
    listCollectionActivityLogs(),
    getPavilionProgressSummary(),
  ]);

  const initialVisitDate = todayDateString();
  const foodCount = experiences.filter(
    (experience) => experience.activity_type === "food",
  ).length;
  const pinBadgeCount = experiences.filter(
    (experience) => experience.activity_type === "pin",
  ).length;
  const eventCount = experiences.filter(
    (experience) => experience.activity_type === "event_participation",
  ).length;
  const pavilionTone = getActivityTypeMeta("pavilion_visit");
  const foodTone = getActivityTypeMeta("food");
  const pinTone = getActivityTypeMeta("pin");
  const eventTone = getActivityTypeMeta("event_participation");
  const summaryItems = [
    {
      label: "来場日",
      value: sessions.length,
      cardClassName: neutralSummaryTone.cardClassName,
      labelClassName: neutralSummaryTone.labelClassName,
    },
    {
      label: "パビリオン",
      value: pavilionProgress.visitedPavilions,
      cardClassName: pavilionTone.summaryCardClassName,
      labelClassName: pavilionTone.summaryLabelClassName,
    },
    {
      label: "フード",
      value: foodCount,
      cardClassName: foodTone.summaryCardClassName,
      labelClassName: foodTone.summaryLabelClassName,
    },
    {
      label: "ピンバッジ",
      value: pinBadgeCount,
      cardClassName: pinTone.summaryCardClassName,
      labelClassName: pinTone.summaryLabelClassName,
    },
    {
      label: "イベント",
      value: eventCount,
      cardClassName: eventTone.summaryCardClassName,
      labelClassName: eventTone.summaryLabelClassName,
    },
  ];
  const secondaryLinkClassName =
    "inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
        <AppPrimaryNav currentPath="/" />

        <section className="w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-sm ring-1 ring-slate-200">
          <div className="px-6 py-8 sm:px-6 lg:px-10 lg:py-10">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-emerald-700">BloomLog</p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                  来場日の思い出を、あとから振り返りやすい形に。
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  行った日ごとに、思い出を記録できます。まずは来場日を開いて記録を始めましょう。記録した思い出はあとから思い出アルバムで振り返れます。
                </p>
              </div>

              <div className="w-full rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
                <form action={startSessionForDateAction}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="visit-date"
                        className="text-sm font-medium text-slate-700"
                      >
                        来場日
                      </label>
                      <input
                        id="visit-date"
                        name="visitDate"
                        type="date"
                        defaultValue={initialVisitDate}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                      />
                    </div>

                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-4 text-base font-semibold text-white transition hover:bg-slate-700"
                    >
                      来場日を開く
                    </button>
                  </div>
                </form>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {summaryItems.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-3xl px-4 py-4 ring-1 ${item.cardClassName}`}
                    >
                      <p className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        {item.value}
                      </p>
                      <p
                        className={`mt-1 text-xs font-medium tracking-wide ${item.labelClassName}`}
                      >
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full flex flex-col gap-6">
          <div className="w-full rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">最近の来場日</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  直近の来場日を開くと、思い出の続きをすぐに記録できます。
                </p>
              </div>
            </div>

            {sessions.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-sm leading-7 text-slate-600">
                まだ来場日はありません。最初の来場日を開くと、ここから思い出を記録できるようになります。
              </div>
            ) : (
              <div className="mt-6">
                <Link href="/sessions" className={secondaryLinkClassName}>
                  来場日一覧を見る
                </Link>
              </div>
            )}
          </div>

          <div className="w-full rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">思い出アルバム</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              記録した思い出をカテゴリごとにまとめて振り返れます。
            </p>
            <div className="mt-6">
              <Link href="/collection" className={secondaryLinkClassName}>
                思い出アルバムを見る
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}