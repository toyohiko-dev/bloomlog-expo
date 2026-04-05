"use client";

import Link from "next/link";
import { useDeferredValue, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { searchPavilions, type PavilionOption } from "@/lib/session-shared";
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
  const deferredPavilionSearch = useDeferredValue(pavilionSearch);

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
  const selectedPavilion =
    pavilions.find((pavilion) => pavilion.id === selectedPavilionId) ?? null;
  const showPrice = activityType === "food" || activityType === "pin";
  const showAcquisitionMethod = activityType === "pin";
  const showPavilionPicker = activityType === "pavilion_visit";
  const notesLength = memo.length;
  const filteredPavilions = searchPavilions(pavilions, deferredPavilionSearch);
  const hasPavilionSearch = deferredPavilionSearch.trim().length > 0;

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
    if (mode === "create") {
      draftsRef.current = {
        pavilion_visit: createEmptyDraft(),
        food: createEmptyDraft(),
        pin: createEmptyDraft(),
        event_participation: createEmptyDraft(),
      };
      setActivityType(nextActivityType);
      setTitle("");
      setMemo("");
      setOccurredAt("");
      setPrice("");
      setAcquisitionMethod("");
      setPavilionSearch("");
      setSelectedPavilionId("");
      setState((current) => ({
        ...current,
        status: "idle",
        message: "",
        fieldErrors: {
          ...current.fieldErrors,
          activityType: undefined,
          pavilionId: undefined,
          title: undefined,
          memo: undefined,
          occurredAt: undefined,
          price: undefined,
          acquisitionMethod: undefined,
        },
      }));
      return;
    }

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
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <fieldset disabled={pending} className={pending ? "opacity-70" : undefined}>
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50/80">
          <div className="border-b border-slate-200 bg-white/80 px-5 py-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">思い出の種類</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  まず種類を選ぶ
                </h3>
              </div>
              <span
                className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${activityTypeMeta.badgeClassName}`}
              >
                {activityTypeMeta.label}
              </span>
            </div>

            <fieldset className="mt-5">
              <legend className="sr-only">思い出の種類</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {activityTypeOptions.map((option) => {
                  const active = activityType === option.value;

                  return (
                    <label key={option.value} className="block">
                      <input
                        type="radio"
                        name="activityType"
                        value={option.value}
                        checked={active}
                        onChange={() => handleActivityTypeChange(option.value)}
                        className="peer sr-only"
                      />
                      <span
                        className={`flex h-full min-h-24 flex-col items-start justify-between rounded-3xl border px-4 py-4 text-left transition ${
                          active
                            ? option.activeButtonClassName
                            : `${option.buttonClassName} hover:brightness-[0.98]`
                        }`}
                      >
                        <span className="text-sm font-semibold">{option.label}</span>
                        <span className="text-xs leading-5 text-current/80">
                          {option.value === "pavilion_visit"
                            ? "訪れた場所を記録"
                            : option.value === "food"
                              ? "食べたものを記録"
                              : option.value === "pin"
                                ? "手に入れたピンを記録"
                                : "参加したイベントを記録"}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
            {state.fieldErrors.activityType ? (
              <p className="mt-2 text-sm text-rose-600">
                {state.fieldErrors.activityType}
              </p>
            ) : null}
          </div>

          <div className="space-y-5 px-5 py-5">
            {showPavilionPicker ? (
              <div className="space-y-3">
                <input type="hidden" name="title" value={title} />
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="pavilion-search"
                    className="block text-sm font-medium text-slate-700"
                  >
                    パビリオン検索
                  </label>
                  <span className="text-xs text-slate-400">
                    名前の一部でも検索できます
                  </span>
                </div>
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
                  placeholder="パビリオン名で検索"
                  className={fieldClass(Boolean(state.fieldErrors.pavilionId))}
                />

                {selectedPavilion ? (
                  <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    選択中: {selectedPavilion.name}
                    {selectedPavilion.official_name &&
                    selectedPavilion.official_name !== selectedPavilion.name
                      ? ` (${selectedPavilion.official_name})`
                      : ""}
                  </div>
                ) : null}

                {hasPavilionSearch ? (
                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 px-4 py-3 text-xs text-slate-500">
                      候補から選択
                    </div>
                    <div className="max-h-72 overflow-y-auto p-2">
                      {filteredPavilions.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-slate-500">
                          条件に合うパビリオンが見つかりません。
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {filteredPavilions.map((pavilion) => {
                            const selected = selectedPavilionId === pavilion.id;
                            const aliases = pavilion.aliases.slice(0, 3);

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
                                className={`flex w-full flex-col gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                                  selected
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                                }`}
                              >
                                <span className="text-sm font-semibold">
                                  {pavilion.name}
                                </span>
                                {pavilion.official_name &&
                                pavilion.official_name !== pavilion.name ? (
                                  <span
                                    className={`text-xs ${
                                      selected ? "text-slate-200" : "text-slate-500"
                                    }`}
                                  >
                                    {pavilion.official_name}
                                  </span>
                                ) : null}
                                {aliases.length > 0 ? (
                                  <span
                                    className={`text-xs ${
                                      selected ? "text-slate-300" : "text-slate-500"
                                    }`}
                                  >
                                    別名: {aliases.join(" / ")}
                                  </span>
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    パビリオン名を入力すると候補が表示されます。
                  </div>
                )}

                {state.fieldErrors.pavilionId ? (
                  <p className="text-sm text-rose-600">
                    {state.fieldErrors.pavilionId}
                  </p>
                ) : null}
              </div>
            ) : (
              <div>
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
              </div>
            )}

            <div>
              <label
                htmlFor="occurredAt"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                時刻
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
                入力すると、タイムラインの並び順にも反映されます。
              </p>
              {state.fieldErrors.occurredAt ? (
                <p className="mt-2 text-sm text-rose-600">
                  {state.fieldErrors.occurredAt}
                </p>
              ) : null}
            </div>

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
                  <p className="mt-2 text-sm text-rose-600">
                    {state.fieldErrors.price}
                  </p>
                ) : null}
              </div>
            ) : null}

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
                placeholder="あとで見返したいことを記録できます。"
                className={fieldClass(Boolean(state.fieldErrors.memo))}
              />
              <p className="mt-2 text-xs text-slate-500">
                メモは1000文字まで入力できます。
              </p>
              {state.fieldErrors.memo ? (
                <p className="mt-2 text-sm text-rose-600">
                  {state.fieldErrors.memo}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      </fieldset>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={pending || (mode === "edit" && !isDirty)}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending
            ? "保存中..."
            : submitLabel ?? (mode === "edit" ? "保存する" : "記録する")}
        </button>
        {mode === "create" ? (
          <span className="text-sm text-slate-500">
            保存した思い出は下のタイムラインにすぐ追加されます。
          </span>
        ) : null}
        {cancelHref ? (
          <Link
            href={cancelHref}
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            {cancelLabel ?? "キャンセル"}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
