export const activityTypeOptions = [
  {
    value: "pavilion_visit",
    label: "パビリオン",
    badgeClassName: "bg-sky-100 text-sky-700",
    buttonClassName: "border-sky-200 bg-sky-50 text-sky-700",
    titleLabel: "パビリオン",
    titlePlaceholder: "訪れたパビリオン",
  },
  {
    value: "food",
    label: "フード",
    badgeClassName: "bg-amber-100 text-amber-700",
    buttonClassName: "border-amber-200 bg-amber-50 text-amber-700",
    titleLabel: "フード名",
    titlePlaceholder: "例: ソフトクリーム",
  },
  {
    value: "pin",
    label: "ピンバッジ",
    badgeClassName: "bg-fuchsia-100 text-fuchsia-700",
    buttonClassName: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
    titleLabel: "ピンバッジ名",
    titlePlaceholder: "例: 公式ロゴピンバッジ",
  },
  {
    value: "event_participation",
    label: "イベント",
    badgeClassName: "bg-emerald-100 text-emerald-700",
    buttonClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
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
      badgeClassName: "bg-slate-100 text-slate-600",
      buttonClassName: "border-slate-200 bg-slate-50 text-slate-700",
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
