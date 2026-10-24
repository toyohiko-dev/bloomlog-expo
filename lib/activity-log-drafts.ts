import { activityTypeOptions, type ActivityType } from "./activity-types";

export type ActivityTypeDraft = {
  title: string;
  memo: string;
  occurredAt: string;
  price: string;
  acquisitionMethod: string;
  pavilionId: string;
  pavilionSearch: string;
  photo: File | null;
  photoNeedsReselect: boolean;
};

export function createEmptyDraft(): ActivityTypeDraft {
  return {
    title: "", memo: "", occurredAt: "", price: "", acquisitionMethod: "",
    pavilionId: "", pavilionSearch: "", photo: null, photoNeedsReselect: false,
  };
}

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function prefix(userId: string, sessionId: string) {
  return `bloomlog:activity-draft:v1:${encodeURIComponent(userId)}:${encodeURIComponent(sessionId)}:`;
}

function isActivityType(value: unknown): value is ActivityType {
  return activityTypeOptions.some((option) => option.value === value);
}

function parseDraft(raw: string | null, type: ActivityType): ActivityTypeDraft | null {
  if (!raw || raw.length > 16000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return null;
    const data = value as Record<string, unknown>;
    if (data.version !== 1 || data.activityType !== type || typeof data.hasPhoto !== "boolean") return null;
    const limits = { title: 5000, memo: 1000, occurredAt: 5, price: 100, acquisitionMethod: 100, pavilionId: 200, pavilionSearch: 5000 };
    for (const [field, limit] of Object.entries(limits)) {
      if (typeof data[field] !== "string" || (data[field] as string).length > limit) return null;
    }
    if (data.occurredAt !== "" && !/^([01]\d|2[0-3]):[0-5]\d$/.test(data.occurredAt as string)) return null;
    return {
      title: data.title as string, memo: data.memo as string,
      occurredAt: data.occurredAt as string, price: data.price as string,
      acquisitionMethod: data.acquisitionMethod as string,
      pavilionId: data.pavilionId as string, pavilionSearch: data.pavilionSearch as string,
      photo: null, photoNeedsReselect: data.hasPhoto,
    };
  } catch {
    return null;
  }
}

export function readActivityDrafts(storage: DraftStorage, userId: string, sessionId: string) {
  const drafts = {} as Record<ActivityType, ActivityTypeDraft>;
  let restored = false;
  for (const { value } of activityTypeOptions) {
    const draft = parseDraft(storage.getItem(prefix(userId, sessionId) + value), value);
    if (draft) restored = true;
    drafts[value] = draft ?? createEmptyDraft();
  }
  const active = storage.getItem(prefix(userId, sessionId) + "active");
  return { drafts, restored, activeType: isActivityType(active) ? active : "pavilion_visit" as ActivityType };
}

export function writeActivityDraft(storage: DraftStorage, userId: string, sessionId: string, type: ActivityType, draft: ActivityTypeDraft) {
  const key = prefix(userId, sessionId) + type;
  const { photo, photoNeedsReselect, ...text } = draft;
  const hasPhoto = Boolean(photo || photoNeedsReselect);
  if (Object.values(text).some(Boolean) || hasPhoto) {
    storage.setItem(key, JSON.stringify({ version: 1, activityType: type, ...text, hasPhoto }));
  } else {
    storage.removeItem(key);
  }
  storage.setItem(prefix(userId, sessionId) + "active", type);
}

export function removeActivityDraft(storage: DraftStorage, userId: string, sessionId: string, type: ActivityType) {
  storage.removeItem(prefix(userId, sessionId) + type);
}
