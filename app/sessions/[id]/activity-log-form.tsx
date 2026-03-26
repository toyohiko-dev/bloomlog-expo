"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  initialActivityLogFormState,
  type ActivityLogFormState,
} from "@/lib/activity-log-form-state";
import {
  acquisitionMethodOptions,
  activityTypeOptions,
  getActivityTypeMeta,
  normalizeAcquisitionMethod,
  type ActivityType,
} from "@/lib/activity-types";
import type { PavilionOption } from "@/lib/sessions";
import {
  submitActivityLogAction,
  updateActivityLogAction,
} from "@/app/sessions/actions";

function toTimeValue(value?: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Tokyo",
  }).format(date);
}

function fieldClass(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition focus:ring-4 ${
    hasError
      ? "border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-100"
      : "border-slate-300 bg-white focus:border-sky-500 focus:ring-sky-100"
  }`;
}

type ActivityLogFormProps = {
  sessionId: string;
  pavilions: PavilionOption[];
  mode?: "create" | "edit";
  logId?: string;
  successRedirectPath?: string;
  submitLabel?: string;
  cancelHref?: string;
  cancelLabel?: string;
  initialActivityType?: ActivityType;
  initialTitle?: string;
  initialMemo?: string;
  initialOccurredAt?: string | null;
  initialPrice?: number | null;
  initialAcquisitionMethod?: string | null;
  initialPavilionId?: string | null;
};

type ActivityTypeDraft = {
  title: string;
  price: string;
  acquisitionMethod: string;
  pavilionId: string;
  pavilionSearch: string;
};

function createEmptyDraft(): ActivityTypeDraft {
  return {
    title: "",
    price: "",
    acquisitionMethod: "",
    pavilionId: "",
    pavilionSearch: "",
  };
}

export function ActivityLogForm({
  sessionId,
  pavilions,
  mode = "create",
  logId,
  successRedirectPath,
  submitLabel,
  cancelHref,
  cancelLabel,
  initialActivityType = "pavilion_visit",
  initialTitle = "",
  initialMemo = "",
  initialOccurredAt = null,
  initialPrice = null,
  initialAcquisitionMethod = "purchase",
  initialPavilionId = null,
}: ActivityLogFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActivityLogFormState>(
    initialActivityLogFormState,
  );
  const [activityType, setActivityType] =
    useState<ActivityType>(initialActivityType);
  const [title, setTitle] = useState(initialTitle);
  const [memo, setMemo] = useState(initialMemo);
  const [occurredAt, setOccurredAt] = useState(toTimeValue(initialOccurredAt));
  const [price, setPrice] = useState(
    initialPrice === null ? "" : String(initialPrice),
  );
  const [acquisitionMethod, setAcquisitionMethod] = useState<string>(
    normalizeAcquisitionMethod(initialAcquisitionMethod) ?? "",
  );
  const initialSelectedPavilion =
    pavilions.find((pavilion) => pavilion.id === initialPavilionId) ?? null;
  const [pavilionSearch, setPavilionSearch] = useState(
    initialSelectedPavilion?.name ?? initialTitle,
  );
  const [selectedPavilionId, setSelectedPavilionId] = useState(
    initialSelectedPavilion?.id ?? "",
  );

  const draftsRef = useRef<Record<ActivityType, ActivityTypeDraft>>({
    pavilion_visit:
      initialActivityType === "pavilion_visit"
        ? {
            title: initialSelectedPavilion?.name ?? initialTitle,
            price: "",
            acquisitionMethod: "",
            pavilionId: initialSelectedPavilion?.id ?? "",
            pavilionSearch: initialSelectedPavilion?.name ?? initialTitle,
          }
        : createEmptyDraft(),
    food:
      initialActivityType === "food"
        ? {
            title: initialTitle,
            price: initialPrice === null ? "" : String(initialPrice),
            acquisitionMethod: "",
            pavilionId: "",
            pavilionSearch: "",
          }
        : createEmptyDraft(),
    pin:
      initialActivityType === "pin"
        ? {
            title: initialTitle,
            price: initialPrice === null ? "" : String(initialPrice),
            acquisitionMethod:
              normalizeAcquisitionMethod(initialAcquisitionMethod) ?? "",
            pavilionId: "",
            pavilionSearch: "",
          }
        : createEmptyDraft(),
    event_participation:
      initialActivityType === "event_participation"
        ? {
            title: initialTitle,
            price: "",
            acquisitionMethod: "",
            pavilionId: "",
            pavilionSearch: "",
          }
        : createEmptyDraft(),
  });

  const normalizedInitialMethod =
    normalizeAcquisitionMethod(initialAcquisitionMethod) ?? "";
  const normalizedInitialTime = toTimeValue(initialOccurredAt);
  const normalizedInitialPrice =
    initialPrice === null ? "" : String(initialPrice);
  const normalizedInitialPavilionId = initialSelectedPavilion?.id ?? "";
  const activityTypeMeta = getActivityTypeMeta(activityType);
  const showPrice = activityType === "food" || activityType === "pin";
  const showAcquisitionMethod = activityType === "pin";
  const showPavilionPicker = activityType === "pavilion_visit";
  const notesLength = memo.length;

  const filteredPavilions = pavilions
    .filter((pavilion) => {
      const keyword = pavilionSearch.trim().toLowerCase();

      if (!keyword) {
        return true;
      }

      return (
        pavilion.name.toLowerCase().includes(keyword) ||
        (pavilion.official_name ?? "").toLowerCase().includes(keyword)
      );
    })
    .slice(0, 8);

  const isDirty =
    mode === "create"
      ? Boolean(
          title ||
            memo ||
            occurredAt ||
            price ||
            activityType !== "pavilion_visit" ||
            selectedPavilionId,
        )
      : activityType !== initialActivityType ||
        selectedPavilionId !== normalizedInitialPavilionId ||
        title !== initialTitle ||
        memo !== initialMemo ||
        occurredAt !== normalizedInitialTime ||
        price !== normalizedInitialPrice ||
        acquisitionMethod !== normalizedInitialMethod;

  function clearFieldState(field: keyof ActivityLogFormState["fieldErrors"]) {
    setState((current) => ({
      ...current,
      status: "idle",
      message: "",
      fieldErrors: {
        ...current.fieldErrors,
        [field]: undefined,
      },
    }));
  }

  function clearTypeSpecificFieldStates() {
    setState((current) => ({
      ...current,
      status: "idle",
      message: "",
      fieldErrors: {
        ...current.fieldErrors,
        pavilionId: undefined,
        title: undefined,
        price: undefined,
        acquisitionMethod: undefined,
      },
    }));
  }

  function buildCurrentDraft(): ActivityTypeDraft {
    return {
      title,
      price,
      acquisitionMethod,
      pavilionId: selectedPavilionId,
      pavilionSearch,
    };
  }

  function handleActivityTypeChange(nextActivityType: ActivityType) {
    draftsRef.current[activityType] = buildCurrentDraft();
    const nextDraft = draftsRef.current[nextActivityType] ?? createEmptyDraft();

    setActivityType(nextActivityType);
    setTitle(nextDraft.title);
    setPrice(nextDraft.price);
    setAcquisitionMethod(nextDraft.acquisitionMethod);
    setPavilionSearch(nextDraft.pavilionSearch);
    setSelectedPavilionId(nextDraft.pavilionId);
    clearFieldState("activityType");
    clearTypeSpecificFieldStates();
  }

  function resetForm() {
    draftsRef.current = {
      pavilion_visit: createEmptyDraft(),
      food: createEmptyDraft(),
      pin: createEmptyDraft(),
      event_participation: createEmptyDraft(),
    };
    setActivityType("pavilion_visit");
    setTitle("");
    setMemo("");
    setOccurredAt("");
    setPrice("");
    setAcquisitionMethod("");
    setPavilionSearch("");
    setSelectedPavilionId("");
    setState(initialActivityLogFormState);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result =
        mode === "edit"
          ? await updateActivityLogAction(formData)
          : await submitActivityLogAction(formData);

      setState(result);

      if (result.status !== "success") {
        return;
      }

      if (successRedirectPath) {
        router.push(successRedirectPath);
        router.refresh();
        return;
      }

      if (mode === "edit") {
        router.push(`/sessions/${sessionId}`);
        router.refresh();
        return;
      }

      resetForm();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-5">
      <input type="hidden" name="sessionId" value={sessionId} />
      {mode === "edit" && logId ? (
        <input type="hidden" name="logId" value={logId} />
      ) : null}
      <input type="hidden" name="pavilionId" value={selectedPavilionId} />

      {state.message ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <fieldset
        disabled={pending}
        className={pending ? "space-y-5 opacity-70" : "space-y-5"}
      >
        <div>
          <fieldset>
            <legend className="mb-2 block text-sm font-medium text-slate-700">
              体験の種類
            </legend>
            <div className="grid grid-cols-2 gap-3">
              {activityTypeOptions.map((option) => (
                <label key={option.value} className="block">
                  <input
                    type="radio"
                    name="activityType"
                    value={option.value}
                    checked={activityType === option.value}
                    onChange={() => handleActivityTypeChange(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    className={`flex min-h-12 items-center justify-center rounded-2xl border px-4 py-3 text-center text-sm font-medium transition peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white ${option.buttonClassName}`}
                  >
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          {state.fieldErrors.activityType ? (
            <p className="mt-2 text-sm text-rose-600">
              {state.fieldErrors.activityType}
            </p>
          ) : null}
        </div>

        <div>
          {showPavilionPicker ? (
            <>
              <input type="hidden" name="title" value={title} />
              <label
                htmlFor="pavilion-search"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                パビリオン
              </label>
              <input
                id="pavilion-search"
                type="text"
                value={pavilionSearch}
                onChange={(event) => {
                  setPavilionSearch(event.target.value);
                  setSelectedPavilionId("");
                  setTitle("");
                  clearFieldState("pavilionId");
                }}
                placeholder="パビリオン名で探す"
                className={fieldClass(Boolean(state.fieldErrors.pavilionId))}
              />
              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-2">
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {filteredPavilions.length === 0 ? (
                    <p className="px-3 py-2 text-sm text-slate-500">
                      条件に合うパビリオンが見つかりません。
                    </p>
                  ) : (
                    filteredPavilions.map((pavilion) => {
                      const selected = selectedPavilionId === pavilion.id;

                      return (
                        <button
                          key={pavilion.id}
                          type="button"
                          onClick={() => {
                            setSelectedPavilionId(pavilion.id);
                            setPavilionSearch(pavilion.name);
                            setTitle(pavilion.name);
                            clearFieldState("pavilionId");
                          }}
                          className={`flex w-full items-start justify-between rounded-2xl px-3 py-3 text-left text-sm transition ${
                            selected
                              ? "bg-slate-900 text-white"
                              : "bg-white text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          <span>
                            <span className="block font-medium">{pavilion.name}</span>
                            {pavilion.official_name ? (
                              <span
                                className={`mt-1 block text-xs ${
                                  selected ? "text-slate-200" : "text-slate-500"
                                }`}
                              >
                                {pavilion.official_name}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
              {state.fieldErrors.pavilionId ? (
                <p className="mt-2 text-sm text-rose-600">
                  {state.fieldErrors.pavilionId}
                </p>
              ) : null}
            </>
          ) : (
            <>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                {activityTypeMeta.titleLabel}
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  clearFieldState("title");
                }}
                placeholder={activityTypeMeta.titlePlaceholder}
                className={fieldClass(Boolean(state.fieldErrors.title))}
              />
              {state.fieldErrors.title ? (
                <p className="mt-2 text-sm text-rose-600">
                  {state.fieldErrors.title}
                </p>
              ) : null}
            </>
          )}
        </div>

        {showAcquisitionMethod ? (
          <div>
            <fieldset>
              <legend className="mb-2 block text-sm font-medium text-slate-700">
                入手方法
              </legend>
              <div className="grid grid-cols-2 gap-3">
                {acquisitionMethodOptions.map((option) => (
                  <label key={option.value} className="block">
                    <input
                      type="radio"
                      name="acquisitionMethod"
                      value={option.value}
                      checked={acquisitionMethod === option.value}
                      onChange={() => {
                        setAcquisitionMethod(option.value);
                        clearFieldState("acquisitionMethod");
                      }}
                      className="peer sr-only"
                    />
                    <span className="flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-700 transition peer-checked:border-slate-900 peer-checked:bg-slate-900 peer-checked:text-white">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {state.fieldErrors.acquisitionMethod ? (
              <p className="mt-2 text-sm text-rose-600">
                {state.fieldErrors.acquisitionMethod}
              </p>
            ) : null}
          </div>
        ) : null}

        {showPrice ? (
          <div>
            <label
              htmlFor="price"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              価格
            </label>
            <input
              id="price"
              name="price"
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                clearFieldState("price");
              }}
              placeholder="例: 1200"
              className={fieldClass(Boolean(state.fieldErrors.price))}
            />
            {state.fieldErrors.price ? (
              <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.price}</p>
            ) : null}
          </div>
        ) : null}

        <div>
          <label
            htmlFor="occurredAt"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            発生時刻（任意）
          </label>
          <input
            id="occurredAt"
            name="occurredAt"
            type="time"
            value={occurredAt}
            onChange={(event) => {
              setOccurredAt(event.target.value);
              clearFieldState("occurredAt");
            }}
            className={fieldClass(Boolean(state.fieldErrors.occurredAt))}
          />
          <p className="mt-2 text-xs leading-5 text-slate-500">
            日付は訪問日として保存されます。時刻を入力した場合のみ記録に反映されます。
          </p>
          {state.fieldErrors.occurredAt ? (
            <p className="mt-2 text-sm text-rose-600">
              {state.fieldErrors.occurredAt}
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label
              htmlFor="memo"
              className="block text-sm font-medium text-slate-700"
            >
              メモ
            </label>
            <span className="text-xs text-slate-400">{notesLength}/1000</span>
          </div>
          <textarea
            id="memo"
            name="memo"
            rows={5}
            value={memo}
            onChange={(event) => {
              setMemo(event.target.value);
              clearFieldState("memo");
            }}
            maxLength={1000}
            placeholder="あとで思い出したいことを残せます。"
            className={fieldClass(Boolean(state.fieldErrors.memo))}
          />
          <p className="mt-2 text-xs text-slate-500">
            メモは1000文字まで入力できます。
          </p>
          {state.fieldErrors.memo ? (
            <p className="mt-2 text-sm text-rose-600">{state.fieldErrors.memo}</p>
          ) : null}
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={pending || (mode === "edit" && !isDirty)}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 sm:w-auto"
        >
          {pending
            ? "保存中..."
            : submitLabel ?? (mode === "edit" ? "更新する" : "記録する")}
        </button>
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900 sm:w-auto"
          >
            {cancelLabel ?? "キャンセル"}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
