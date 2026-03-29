export const activityTypeOptions = [
  {
    value: "pavilion_visit",
    label: "パビリオン",
    badgeClassName: "border border-sky-200 bg-sky-50 text-sky-700",
    buttonClassName: "border-sky-200 bg-sky-50/70 text-sky-800",
    activeButtonClassName:
      "border-sky-300 bg-sky-50 text-sky-900 ring-2 ring-sky-100 shadow-sm",
    summaryCardClassName: "bg-sky-50/70 ring-sky-100",
    summaryLabelClassName: "text-sky-700",
    iconClassName: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
    accentClassName: "border-sky-100",
    titleLabel: "パビリオン名",
    titlePlaceholder: "訪れたパビリオン",
  },
  {
    value: "food",
    label: "フード",
    badgeClassName: "border border-amber-200 bg-amber-50 text-amber-700",
    buttonClassName: "border-amber-200 bg-amber-50/70 text-amber-800",
    activeButtonClassName:
      "border-amber-300 bg-amber-50 text-amber-900 ring-2 ring-amber-100 shadow-sm",
    summaryCardClassName: "bg-amber-50/70 ring-amber-100",
    summaryLabelClassName: "text-amber-700",
    iconClassName: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
    accentClassName: "border-amber-100",
    titleLabel: "フード名",
    titlePlaceholder: "例: ソフトクリーム",
  },
  {
    value: "pin",
    label: "ピンバッジ",
    badgeClassName: "border border-pink-200 bg-pink-50 text-pink-700",
    buttonClassName: "border-pink-200 bg-pink-50/70 text-pink-800",
    activeButtonClassName:
      "border-pink-300 bg-pink-50 text-pink-900 ring-2 ring-pink-100 shadow-sm",
    summaryCardClassName: "bg-pink-50/70 ring-pink-100",
    summaryLabelClassName: "text-pink-700",
    iconClassName: "bg-pink-50 text-pink-700 ring-1 ring-pink-100",
    accentClassName: "border-pink-100",
    titleLabel: "ピンバッジ名",
    titlePlaceholder: "例: 公式ロゴピンバッジ",
  },
  {
    value: "event_participation",
    label: "イベント",
    badgeClassName: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    buttonClassName: "border-emerald-200 bg-emerald-50/70 text-emerald-800",
    activeButtonClassName:
      "border-emerald-300 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-100 shadow-sm",
    summaryCardClassName: "bg-emerald-50/70 ring-emerald-100",
    summaryLabelClassName: "text-emerald-700",
    iconClassName: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
    accentClassName: "border-emerald-100",
    titleLabel: "イベント名",
    titlePlaceholder: "例: ステージショー",
  },
] as const;

export const acquisitionMethodOptions = [
  { value: "purchase", label: "購入" },
  { value: "exchange", label: "交換" },
  { value: "gift", label: "配布" },
  { value: "other", label: "その他" },
] as const;

export type ActivityType = (typeof activityTypeOptions)[number]["value"];
export type AcquisitionMethod =
  (typeof acquisitionMethodOptions)[number]["value"];

export const neutralSummaryTone = {
  cardClassName: "bg-slate-50 ring-slate-200",
  labelClassName: "text-slate-500",
} as const;

const legacyAcquisitionMethodMap: Record<string, AcquisitionMethod> = {
  purchase: "purchase",
  exchange: "exchange",
  gift: "gift",
  other: "other",
  gacha: "other",
  shop: "purchase",
  shop_purchase: "purchase",
  bonus: "gift",
  visitor_bonus: "gift",
};

export function normalizeAcquisitionMethod(
  value: string | null | undefined,
): AcquisitionMethod | null {
  if (!value) {
    return null;
  }

  return legacyAcquisitionMethodMap[value] ?? null;
}

export function getActivityTypeMeta(activityType: string | null) {
  return (
    activityTypeOptions.find((option) => option.value === activityType) ?? {
      value: "unknown",
      label: "未設定",
      badgeClassName: "border border-slate-200 bg-slate-100 text-slate-600",
      buttonClassName: "border-slate-200 bg-slate-50 text-slate-700",
      activeButtonClassName:
        "border-slate-300 bg-slate-100 text-slate-900 ring-2 ring-slate-100 shadow-sm",
      summaryCardClassName: "bg-slate-50 ring-slate-200",
      summaryLabelClassName: "text-slate-500",
      iconClassName: "bg-white text-slate-600 ring-1 ring-slate-200",
      accentClassName: "border-slate-200",
      titleLabel: "名前",
      titlePlaceholder: "名前を入力",
    }
  );
}

export function getAcquisitionMethodLabel(value: string | null) {
  const normalized = normalizeAcquisitionMethod(value);

  if (!normalized) {
    return value;
  }

  return (
    acquisitionMethodOptions.find((option) => option.value === normalized)?.label ??
    normalized
  );
}
