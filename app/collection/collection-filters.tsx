"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  getAcquisitionMethodLabel,
  getActivityTypeMeta,
  neutralSummaryTone,
  type ActivityType,
} from "@/lib/activity-types";
import { getActivityLogTitle, type ActivityLog } from "@/lib/session-shared";

type CollectionFiltersProps = {
  logs: CollectionActivityLog[];
};

type CollectionActivityLog = ActivityLog & {
  thumbnailUrl: string | null;
  pavilionThumbnailUrl: string | null;
};

type FilterValue = "all" | ActivityType;

type PavilionCollectionItem = {
  key: string;
  title: string;
  count: number;
  firstVisitedAt: string | null;
  latestVisitedAt: string | null;
  latestSessionId: string;
  thumbnailUrl: string | null;
};

const filterOptions: { value: FilterValue; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "pavilion_visit", label: "パビリオン" },
  { value: "food", label: "フード" },
  { value: "pin", label: "ピンバッジ" },
  { value: "event_participation", label: "イベント" },
];

function formatDateTime(value: string | null) {
  if (!value) {
    return "日時未設定";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Tokyo",
  }).format(new Date(value));
}

function normalizeMemoPreview(value: string | null) {
  const normalized = (value ?? "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= 48) {
    return normalized;
  }

  return `${normalized.slice(0, 48)}…`;
}

function getSortTimestamp(log: CollectionActivityLog) {
  return new Date(log.occurred_at ?? log.created_at).getTime();
}

function buildPavilionCollection(logs: CollectionActivityLog[]) {
  const groups = new Map<string, PavilionCollectionItem>();

  for (const log of logs) {
    const title = getActivityLogTitle(log) ?? "名前未設定";
    const key = log.pavilion_id
      ? `pavilion:${log.pavilion_id}`
      : `legacy:${title.trim().toLowerCase()}`;
    const timestamp = log.occurred_at ?? log.created_at;

    const current = groups.get(key);

    if (!current) {
      groups.set(key, {
        key,
        title,
        count: 1,
        firstVisitedAt: timestamp,
        latestVisitedAt: timestamp,
        latestSessionId: log.session_id,
        thumbnailUrl: log.pavilionThumbnailUrl,
      });
      continue;
    }

    current.count += 1;

    if (
      current.firstVisitedAt === null ||
      new Date(timestamp).getTime() < new Date(current.firstVisitedAt).getTime()
    ) {
      current.firstVisitedAt = timestamp;
    }

    if (
      current.latestVisitedAt === null ||
      new Date(timestamp).getTime() > new Date(current.latestVisitedAt).getTime()
    ) {
      current.latestVisitedAt = timestamp;
      current.latestSessionId = log.session_id;
    }

    if (!current.thumbnailUrl && log.pavilionThumbnailUrl) {
      current.thumbnailUrl = log.pavilionThumbnailUrl;
    }
  }

  return Array.from(groups.values()).sort((left, right) => {
    const rightTime = right.latestVisitedAt
      ? new Date(right.latestVisitedAt).getTime()
      : 0;
    const leftTime = left.latestVisitedAt
      ? new Date(left.latestVisitedAt).getTime()
      : 0;
    return rightTime - leftTime;
  });
}

function DetailLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
      <span className="font-medium text-slate-500">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function AlbumThumbnail({
  thumbnailUrl,
  title,
}: {
  thumbnailUrl: string | null;
  title: string;
}) {
  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 sm:mb-4">
      <div className="aspect-square w-full sm:aspect-[4/3]">
        {thumbnailUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover"
            />
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 text-sm font-medium text-slate-400">
            写真なし
          </div>
        )}
      </div>
    </div>
  );
}

export function CollectionFilters({ logs }: CollectionFiltersProps) {
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");

  const filteredLogs = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return logs.filter((log) => {
      const matchFilter =
        activeFilter === "all" ? true : log.activity_type === activeFilter;

      if (!matchFilter) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const title = getActivityLogTitle(log)?.toLowerCase() ?? "";
      const memo = (log.memo ?? "").toLowerCase();

      return (
        title.includes(normalizedKeyword) || memo.includes(normalizedKeyword)
      );
    });
  }, [activeFilter, keyword, logs]);

  const pavilionLogs = filteredLogs.filter(
    (log) => log.activity_type === "pavilion_visit",
  );
  const pavilionCollection = useMemo(
    () => buildPavilionCollection(pavilionLogs),
    [pavilionLogs],
  );

  const groupedLogs = {
    food: filteredLogs.filter((log) => log.activity_type === "food"),
    pin: filteredLogs.filter((log) => log.activity_type === "pin"),
    event_participation: filteredLogs.filter(
      (log) => log.activity_type === "event_participation",
    ),
  };

  const pavilionTone = getActivityTypeMeta("pavilion_visit");
  const foodTone = getActivityTypeMeta("food");
  const pinTone = getActivityTypeMeta("pin");
  const eventTone = getActivityTypeMeta("event_participation");

  const summaryItems = [
    {
      label: "思い出",
      value: filteredLogs.length,
      cardClassName: neutralSummaryTone.cardClassName,
      labelClassName: neutralSummaryTone.labelClassName,
    },
    {
      label: "パビリオン",
      value: pavilionCollection.length,
      cardClassName: pavilionTone.summaryCardClassName,
      labelClassName: pavilionTone.summaryLabelClassName,
    },
    {
      label: "フード",
      value: groupedLogs.food.length,
      cardClassName: foodTone.summaryCardClassName,
      labelClassName: foodTone.summaryLabelClassName,
    },
    {
      label: "ピンバッジ",
      value: groupedLogs.pin.length,
      cardClassName: pinTone.summaryCardClassName,
      labelClassName: pinTone.summaryLabelClassName,
    },
    {
      label: "イベント",
      value: groupedLogs.event_participation.length,
      cardClassName: eventTone.summaryCardClassName,
      labelClassName: eventTone.summaryLabelClassName,
    },
  ];

  const listSections: {
    activityType: ActivityType;
    logs: ActivityLog[];
  }[] = [
    { activityType: "food", logs: groupedLogs.food },
    { activityType: "pin", logs: groupedLogs.pin },
    {
      activityType: "event_participation",
      logs: groupedLogs.event_participation,
    },
  ];

  return (
    <section className="mx-auto w-full max-w-[68rem] space-y-5 lg:space-y-6">
      <div className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            思い出アルバム
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            記録した思い出をカテゴリごとに見返せます。パビリオンはまとめて振り返り、フードやピンバッジ、イベントはひとつずつ一覧にしています。
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className={`rounded-[1.5rem] px-4 py-3 ring-1 sm:px-5 sm:py-4 ${item.cardClassName}`}
            >
              <p className="text-xl font-semibold text-slate-900 sm:text-2xl">
                {item.value}
              </p>
              <p
                className={`mt-1.5 text-[11px] font-medium tracking-wide sm:mt-2 sm:text-xs ${item.labelClassName}`}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="space-y-2">
            <label
              htmlFor="collection-search"
              className="block text-sm font-medium text-slate-700"
            >
              キーワード検索
            </label>
            <input
              id="collection-search"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="名前やメモで探す"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-slate-700">
              カテゴリで絞り込む
            </p>
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const active = activeFilter === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setActiveFilter(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:text-slate-900"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-3 lg:space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">パビリオン</h2>
            <p className="mt-1 hidden text-sm text-slate-600 sm:block">
              来場日ごとに、訪れたパビリオンをまとめて見返せます。
            </p>
          </div>
          <p className="pb-0.5 text-sm font-medium text-slate-500">
            {pavilionCollection.length}件
          </p>
        </div>

        {pavilionCollection.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-8 text-sm leading-7 text-slate-600">
            まだ思い出はありません。来場日でパビリオンの思い出を記録すると、ここに並びます。
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
            {pavilionCollection.map((item) => (
              <Link
                key={item.key}
                href={`/sessions/${item.latestSessionId}`}
                className="flex h-full flex-col rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300 sm:p-4"
              >
                <AlbumThumbnail thumbnailUrl={item.thumbnailUrl} title={item.title} />

                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium sm:px-3 sm:text-xs ${pavilionTone.badgeClassName}`}
                    >
                      パビリオン
                    </span>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-900 sm:mt-3 sm:text-base sm:leading-6">
                      {item.title}
                    </h3>
                  </div>
                  <span className="hidden shrink-0 text-sm font-medium text-slate-700 sm:inline">
                    来場日を見る
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 sm:mt-4 sm:space-y-2">
                  <DetailLine label="回数" value={`${item.count}回`} />
                  <DetailLine label="初回" value={formatDateTime(item.firstVisitedAt)} />
                  <DetailLine label="最近" value={formatDateTime(item.latestVisitedAt)} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {listSections.map((section) => {
        const meta = getActivityTypeMeta(section.activityType);

        return (
          <section key={section.activityType} className="space-y-3 lg:space-y-4">
            <div className="flex items-end justify-between gap-3">
              <div className="max-w-2xl">
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  {meta.label}
                </h2>
                <p className="mt-1 hidden text-sm text-slate-600 sm:block">
                  記録した思い出をそのまま一覧で見返せます。
                </p>
              </div>
              <p className="pb-0.5 text-sm font-medium text-slate-500">
                {section.logs.length}件
              </p>
            </div>

            {section.logs.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white px-6 py-8 text-sm leading-7 text-slate-600">
                まだ思い出はありません。来場日で{meta.label}の思い出を記録すると、ここに並びます。
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {section.logs
                  .slice()
                  .sort((left, right) => getSortTimestamp(right) - getSortTimestamp(left))
                  .map((log) => {
                    const preview = normalizeMemoPreview(log.memo);
                    const thumbnailTitle =
                      getActivityLogTitle(log) || "蜷榊燕譛ｪ險ｭ螳・";

                    return (
                      <Link
                        key={log.id}
                        href={`/sessions/${log.session_id}`}
                        className="flex h-full flex-col rounded-[1.5rem] bg-white p-3 shadow-sm ring-1 ring-slate-200 transition hover:ring-slate-300 sm:p-4"
                      >
                        <AlbumThumbnail
                          thumbnailUrl={log.thumbnailUrl}
                          title={thumbnailTitle}
                        />

                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium sm:px-3 sm:text-xs ${meta.badgeClassName}`}
                            >
                              {meta.label}
                            </span>
                            <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-slate-900 sm:mt-3 sm:text-base sm:leading-6">
                              {getActivityLogTitle(log) || "名前未設定"}
                            </h3>
                          </div>
                          <span className="hidden shrink-0 text-sm font-medium text-slate-700 sm:inline">
                            来場日を見る
                          </span>
                        </div>

                        <div className="mt-3 flex flex-1 flex-col gap-1.5 sm:mt-4 sm:gap-2">
                          <DetailLine
                            label="日時"
                            value={formatDateTime(log.occurred_at ?? log.created_at)}
                          />
                          {section.activityType === "food" && log.price !== null ? (
                            <DetailLine label="価格" value={`¥${log.price}`} />
                          ) : null}
                          {section.activityType === "pin" &&
                          log.acquisition_method ? (
                            <DetailLine
                              label="入手方法"
                              value={getAcquisitionMethodLabel(
                                log.acquisition_method,
                              ) ?? "未設定"}
                            />
                          ) : null}
                          {preview ? (
                            <p className="hidden pt-1 text-sm leading-6 text-slate-600 sm:line-clamp-2 md:block xl:line-clamp-3">
                              {preview}
                            </p>
                          ) : null}
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}
          </section>
        );
      })}
    </section>
  );
}
