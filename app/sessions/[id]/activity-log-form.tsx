"use client";
import {mapPointStorageEnabled} from '@/lib/map-point-config';
import {validateMapPoint,type MapPoint,type MapPointDraft} from '@/lib/memory-map-point';
import {MapPointPicker} from './map-point-picker';
import {prepareActivityPhoto,PhotoPreparationError} from "@/lib/prepare-activity-photo";
import {memoryMapReturnHref} from '@/lib/memory-map-navigation';
import {activityAttemptSignature} from '@/lib/activity-save-attempt';
import {decodePlaceContext,type PlaceContext} from '@/lib/place-context';
import {placeContextStorageEnabled} from '@/lib/place-context-config';


import Link from "next/link";
import { placeRegistry } from "@/lib/place-coordinate-catalog";
import { scopedPavilions, canUsePavilionInEvent, isRegisteredEvent } from "@/lib/place-registry";
import { readDraftPhoto, keepDraftPhoto } from "@/lib/activity-photo-cache";
import { PhotoLocationSuggestions, SelectedPhotoPreview, PlaceContextSummary } from "./photo-location-suggestions";
import { useDeferredValue, useEffect, useRef, useState, useTransition } from "react";
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
  createEmptyDraft, readActivityDrafts, writeActivityDraft, removeActivityDraft,
  type ActivityTypeDraft,
} from "@/lib/activity-log-drafts";
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

const EMPTY_VISIT_SESSIONS: {id:string;visit_date:string;event_id?:string|null}[] = [];

type ActivityLogFormProps = {
  onSaveComplete?: () => void;
  fixtureAdapter?:{photo:File|null;submit:(data:FormData,mode:"create"|"edit")=>Promise<ActivityLogFormState>;onSaved:(id:string|null,mapScope?:string|null)=>void};
  sessionId: string;
  visitDate?: string;
  visitEventId?: string|null;
  recentPavilionIds?: string[];
  visitSessions?: {id:string;visit_date:string;event_id?:string|null}[];
  draftOwnerId?: string;
  pavilions: PavilionOption[];
  mode?: "create" | "edit";
  logId?: string;
  successRedirectPath?: string;
  returnToMap?:boolean;
  returnMapDate?:string|null;
  photoEntry?:boolean;
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
  initialPlaceContext?:PlaceContext|null;
  initialPhoto?:File|null;
  initialMapPoint?:MapPoint|null;
  mapPointAvailable?:boolean;
};

export function ActivityLogForm({
  sessionId,
  fixtureAdapter,
  onSaveComplete,
  visitDate,
  visitEventId = null,
  recentPavilionIds = [],
  visitSessions = EMPTY_VISIT_SESSIONS,
  draftOwnerId,
  pavilions,
  mode = "create",
  logId,
  successRedirectPath,
  returnToMap=false,
  returnMapDate,
  photoEntry=returnToMap,
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
  initialPlaceContext = null,
  initialPhoto = null,
  initialMapPoint = null,
  mapPointAvailable = mapPointStorageEnabled,
}: ActivityLogFormProps) {
  const router = useRouter();
  const draftSessionKey = mode === "edit" ? `${sessionId}:edit:${logId ?? "unknown"}` : sessionId;
  const [recordingSessionId, setRecordingSessionId] = useState(sessionId);
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
    initialSelectedPavilion?.name ?? (initialActivityType === "pavilion_visit" ? initialTitle : ""),
  );
  const [mapPoint,setMapPoint]=useState<MapPoint|null>(initialMapPoint);
  const [pointPicker,setPointPicker]=useState<MapPointDraft|null|false>(false);
  const [photoOrigin,setPhotoOrigin]=useState<"gallery"|"camera">(initialPhoto?"camera":"gallery");
  const [placeContext,setPlaceContext]=useState<PlaceContext|null>(initialPlaceContext);
  const [selectedPavilionId, updateSelectedPavilionId] = useState(
    initialSelectedPavilion?.id ?? "",
  );
  function setSelectedPavilionId(id:string){updateSelectedPavilionId(id);setPlaceContext(null);}
  const [hasSelectedPhoto, setHasSelectedPhoto] = useState(Boolean(initialPhoto));
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(initialPhoto);
  const [photoNeedsReselect, setPhotoNeedsReselect] = useState(false);
  const [draftReady, setDraftReady] = useState(!draftOwnerId);
  const [draftNotice, setDraftNotice] = useState("");
  const submittingRef = useRef(false);
  const photoSelection=useRef<string|undefined>(initialPhoto?crypto.randomUUID():undefined);
  const saveAttempt=useRef<{id:string;signature:string}|null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const deferredPavilionSearch = useDeferredValue(pavilionSearch);
  const selectedDay = visitSessions.find(day=>day.id===recordingSessionId);
  const recordingEventId = selectedDay ? selectedDay.event_id ?? null : visitEventId;
  const availablePavilions = scopedPavilions(pavilions,recordingEventId,placeRegistry);
  const placeCompatible = !selectedPavilionId || canUsePavilionInEvent(placeRegistry,recordingEventId,selectedPavilionId) || (mode==="edit" && selectedPavilionId===initialPavilionId);

  const draftsRef = useRef<Record<ActivityType, ActivityTypeDraft>>({
    pavilion_visit:
      initialActivityType === "pavilion_visit"
        ? {
            ...createEmptyDraft(),
            mapPoint:initialMapPoint,
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
            ...createEmptyDraft(),
            mapPoint:initialMapPoint,
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
            ...createEmptyDraft(),
            mapPoint:initialMapPoint,
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
            ...createEmptyDraft(),
            mapPoint:initialMapPoint,
            title: initialTitle,
            price: "",
            acquisitionMethod: "",
            pavilionId: "",
            pavilionSearch: "",
          }
        : createEmptyDraft(),
  });

  useEffect(() => {
    if (!draftOwnerId) return;
    try {
      const saved = readActivityDrafts(window.localStorage, draftOwnerId, draftSessionKey);
      if (!saved.restored) { setDraftNotice("下書きはこのブラウザに保存されます。"); setDraftReady(true); return; }
      draftsRef.current = saved.drafts;
      const draft = saved.drafts[saved.activeType];
      // Restore browser-owned state after hydration, before enabling the form.
      if (draft.recordingSessionId === sessionId || visitSessions.some(day=>day.id===draft.recordingSessionId)) setRecordingSessionId(draft.recordingSessionId!);
      setActivityType(saved.activeType);
      setTitle(draft.title);
      setMemo(draft.memo);
      setOccurredAt(draft.occurredAt);
      setPrice(draft.price);
      setAcquisitionMethod(draft.acquisitionMethod);
      setPavilionSearch(draft.pavilionSearch);
      setSelectedPavilionId(draft.pavilionId);
      setPlaceContext(draft.placeContext??null);
      setMapPoint(draft.mapPoint??null);setPhotoOrigin(draft.photoOrigin??"gallery");
      photoSelection.current=draft.photoSelectionId;
      saveAttempt.current=draft.saveAttemptId&&draft.saveAttemptSignature?{id:draft.saveAttemptId,signature:draft.saveAttemptSignature}:null;
      const retainedPhoto = draft.photoNeedsReselect ? readDraftPhoto(draftOwnerId, draftSessionKey) : null;
      setSelectedPhoto(retainedPhoto);
      setHasSelectedPhoto(Boolean(retainedPhoto));
      setPhotoNeedsReselect(draft.photoNeedsReselect && !retainedPhoto);
      setDraftNotice(saved.restored
        ? "下書きを復元しました。このブラウザだけに保存されます。"
        : "下書きはこのブラウザに保存されます。");
    } catch {
      setDraftNotice("下書きを保存できません。画面を閉じると入力内容が失われます。");
    }
    setDraftReady(true);
  }, [draftOwnerId, draftSessionKey, sessionId, visitSessions]);

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
  const showPhotoInput = true;
  const notesLength = memo.length;
  const filteredPavilions = deferredPavilionSearch.trim() ? searchPavilions(availablePavilions, deferredPavilionSearch) : availablePavilions;
  const hasPavilionSearch = deferredPavilionSearch.trim().length > 0;

  const isDirty =
    mode === "create"
      ? Boolean(
          title ||
            memo ||
            occurredAt ||
            price ||
            activityType !== "pavilion_visit" ||
            selectedPavilionId ||
            hasSelectedPhoto,
        )
      : activityType !== initialActivityType ||
        selectedPavilionId !== normalizedInitialPavilionId ||
        title !== initialTitle ||
        memo !== initialMemo ||
        occurredAt !== normalizedInitialTime ||
        price !== normalizedInitialPrice ||
        acquisitionMethod !== normalizedInitialMethod ||
        hasSelectedPhoto || JSON.stringify(mapPoint)!==JSON.stringify(initialMapPoint);

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
        photo: undefined,
      },
    }));
  }

  function buildCurrentDraft(): ActivityTypeDraft {
    return {
      recordingSessionId,
      photoSelectionId:photoSelection.current,
      saveAttemptId:saveAttempt.current?.id,
      saveAttemptSignature:saveAttempt.current?.signature,
      placeContext,
      mapPoint,photoOrigin,
      memo,
      occurredAt,
      photo: selectedPhoto,
      photoNeedsReselect,
      title,
      price,
      acquisitionMethod,
      pavilionId: selectedPavilionId,
      pavilionSearch,
    };
  }

  function persistDraft(patch: Partial<ActivityTypeDraft> = {}, type = activityType) {
    if (!draftOwnerId || !draftReady) return;
    try {
      writeActivityDraft(window.localStorage, draftOwnerId, draftSessionKey, type,
        { ...buildCurrentDraft(), ...patch });
      setDraftNotice("下書きをこのブラウザに保存しました。");
    } catch {
      setDraftNotice("下書きを保存できません。画面を閉じると入力内容が失われます。");
    }
  }

  function handleActivityTypeChange(nextActivityType: ActivityType) {
    if (!draftReady || submittingRef.current || pending || nextActivityType === activityType) {
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
    setPlaceContext(nextDraft.placeContext??null);
    setMapPoint(nextDraft.mapPoint??null);
    photoSelection.current=nextDraft.photoSelectionId;
    saveAttempt.current=nextDraft.saveAttemptId&&nextDraft.saveAttemptSignature?{id:nextDraft.saveAttemptId,signature:nextDraft.saveAttemptSignature}:null;
    if (mode === "create") {
      setMemo(nextDraft.memo);
      setOccurredAt(nextDraft.occurredAt);
      // The chosen photo belongs to this recording attempt, not to a category.
      persistDraft({ ...nextDraft, photo: selectedPhoto, photoNeedsReselect, recordingSessionId }, nextActivityType);
      setState(initialActivityLogFormState);
      return;
    }
    clearFieldState("activityType");
    clearTypeSpecificFieldStates();
  }

  function resetForm(savedActivityType: ActivityType) {
    saveAttempt.current=null;
    if(draftOwnerId)keepDraftPhoto(draftOwnerId,draftSessionKey,null);
    draftsRef.current[savedActivityType] = { ...createEmptyDraft(), pavilionId: selectedPavilionId, pavilionSearch: selectedPavilion?.name ?? "" };
    setTitle("");
    setMemo("");
    setOccurredAt("");
    setPrice("");
    setAcquisitionMethod("");
    setPavilionSearch(selectedPavilion?.name ?? "");
    setSelectedPavilionId(selectedPavilionId);
    setMapPoint(null);
    setHasSelectedPhoto(false);
    setSelectedPhoto(null);
    setPhotoNeedsReselect(false);
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
    setState(initialActivityLogFormState);
    if (draftOwnerId) {
      try {
        removeActivityDraft(window.localStorage, draftOwnerId, draftSessionKey, savedActivityType);
        setDraftNotice("保存しました。選択中の場所は次の記録にも使えます。");
      } catch {
        setDraftNotice("思い出は保存されましたが、下書きを消去できませんでした。再読み込み後の重複保存にご注意ください。");
      }
    }
  }

  function choosePhoto(file:File,origin:"gallery"|"camera"="gallery") {
    const nextPoint=mapPoint?.source==="manual"?mapPoint:null;setMapPoint(nextPoint);setPhotoOrigin(origin);
    photoSelection.current=crypto.randomUUID();
    if(draftOwnerId)keepDraftPhoto(draftOwnerId,draftSessionKey,file);
    setSelectedPhoto(file); setHasSelectedPhoto(true); setPhotoNeedsReselect(false);
    persistDraft({photo:file,photoNeedsReselect:false,mapPoint:nextPoint,photoOrigin:origin}); clearFieldState('photo');
  }
  function removeSelectedPhoto() {
    const nextPoint=mapPoint?.source==="manual"?mapPoint:null;setMapPoint(nextPoint);setPhotoOrigin("gallery");
    photoSelection.current=crypto.randomUUID();
    if(draftOwnerId)keepDraftPhoto(draftOwnerId,draftSessionKey,null);
    setSelectedPhoto(null);setHasSelectedPhoto(false);setPhotoNeedsReselect(false);
    if(photoInputRef.current)photoInputRef.current.value='';
    persistDraft({photo:null,photoNeedsReselect:false,mapPoint:nextPoint,photoOrigin:"gallery"});clearFieldState('photo');
  }
  function choosePlace(id:string) {
    setMapPoint(null);
    const place=availablePavilions.find(item=>item.id===id);
    setSelectedPavilionId(place?.id??'');setPavilionSearch(place?.name??'');
    const nextTitle=activityType==='pavilion_visit' ? place?.name??'' : title;
    if(activityType==='pavilion_visit')setTitle(nextTitle);
    persistDraft({mapPoint:null,placeContext:null,pavilionId:place?.id??'',pavilionSearch:place?.name??'',title:nextTitle});clearFieldState('pavilionId');
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draftReady || submittingRef.current || pending) {
      return;
    }
    if(photoNeedsReselect&&!selectedPhoto){setState({status:'error',message:'写真を選び直すか、写真なしに変更してください。ほかの入力は保持しています。',fieldErrors:{photo:'写真の再選択が必要です。'}});return;}
    if(!placeCompatible){setState({status:"error",message:"この来場日の施設対応が未確認です。場所を選び直してください。",fieldErrors:{pavilionId:"イベントに対応する施設を選んでください。"}});return;}
    if(mapPoint){const checked=validateMapPoint(mapPoint,{eventId:recordingEventId,pavilionId:selectedPavilionId||null,activityType});if(!mapPointAvailable||!checked.ok){setState({status:'error',message:'地図の位置を確認するか、あとで指定に変更してください。入力は保持しています。',fieldErrors:{pavilionId:'地図位置がこの記録に対応していません。'}});return;}}
    if(mode==='create'){
      const signature=activityAttemptSignature(JSON.stringify({recordingSessionId,activityType,title,memo,occurredAt,price,acquisitionMethod,selectedPavilionId,placeContext,mapPoint,hasPhoto:Boolean(selectedPhoto||photoNeedsReselect),photoSelection:photoSelection.current}));
      if(!saveAttempt.current)saveAttempt.current={id:crypto.randomUUID(),signature};
    }
    persistDraft();
    const formData = new FormData(event.currentTarget);
    if(mapPointAvailable)formData.set("mapPoint",mapPoint?JSON.stringify(mapPoint):"");
    if(placeContextStorageEnabled)formData.set("placeContext",placeContext?JSON.stringify(placeContext):"");
    if(mode==='create'&&saveAttempt.current){formData.set('saveAttemptId',saveAttempt.current.id);const signature=activityAttemptSignature(JSON.stringify({recordingSessionId,activityType,title,memo,occurredAt,price,acquisitionMethod,selectedPavilionId,placeContext,mapPoint,hasPhoto:Boolean(selectedPhoto||photoNeedsReselect),photoSelection:photoSelection.current}));formData.set('saveAttemptChanged',String(signature!==saveAttempt.current.signature));}
    const submittedActivityType = activityType;
    const submittedRecordId=mode==='edit'?logId??null:saveAttempt.current?.id??null;
    formData.delete("photo");

    submittingRef.current = true;

    startTransition(async () => {
      try {
        if(selectedPhoto){try{formData.set("photo",await prepareActivityPhoto(selectedPhoto));}catch{throw new PhotoPreparationError();}}
        const result =
          fixtureAdapter?await fixtureAdapter.submit(formData,mode):mode === "edit"
            ? await updateActivityLogAction(formData)
            : await submitActivityLogAction(formData);

        setState(result);

        if (result.status !== "success") {
          return;
        }

        if (mode === "create") {
          resetForm(submittedActivityType);
          setState(result);
        }

        if(mode==='edit'&&draftOwnerId){keepDraftPhoto(draftOwnerId,draftSessionKey,null);try{for(const option of activityTypeOptions)removeActivityDraft(window.localStorage,draftOwnerId,draftSessionKey,option.value);}catch{ /* Saved record is authoritative; draft cleanup failure does not undo it. */ }}
        onSaveComplete?.();
        if(fixtureAdapter){fixtureAdapter.onSaved(submittedRecordId,returnMapDate);return;}
        if(returnToMap){router.push(memoryMapReturnHref(recordingEventId,selectedPavilionId||null,returnMapDate===undefined?selectedDay?.visit_date??visitDate??null:returnMapDate,submittedRecordId,Boolean(mapPoint)));router.refresh();return;}
        if (successRedirectPath) {
          router.push(recordingSessionId !== sessionId ? `/sessions/${recordingSessionId}` : successRedirectPath);
          router.refresh();
          return;
        }

        if (mode === "edit") {
          if(draftOwnerId){keepDraftPhoto(draftOwnerId,draftSessionKey,null);try{for(const option of activityTypeOptions)removeActivityDraft(window.localStorage,draftOwnerId,draftSessionKey,option.value);}catch{ /* The record was saved; draft cleanup must not report a failed save. */ }}
          router.push(`/sessions/${sessionId}`);
          router.refresh();
          return;
        }

        router.refresh();
      } catch (error) {
        setState({
          status: "error",
          message: error instanceof PhotoPreparationError ? error.message : "保存できませんでした。入力内容を確認して、もう一度お試しください。",
          fieldErrors: error instanceof PhotoPreparationError ? {photo:"写真を変換できません。写真を選び直すか、写真なしで保存してください。"} : {},
        });
      } finally {
        submittingRef.current = false;
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      encType="multipart/form-data"
    >
      {pointPicker!==false?<MapPointPicker initial={pointPicker} onCancel={()=>setPointPicker(false)} onConfirm={point=>{if(!mapPointAvailable||activityType==='pavilion_visit')return;choosePlace('');setMapPoint(point);setPointPicker(false);persistDraft({mapPoint:point,placeContext:null,pavilionId:'',pavilionSearch:''});}} />:null}
      {fixtureAdapter?<div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">端末内の合成試験です。本番DB・Storageには送信しません。<button type="button" disabled={!fixtureAdapter.photo||pending} onClick={()=>{if(fixtureAdapter.photo)choosePhoto(fixtureAdapter.photo);}} className="mt-2 block min-h-11 rounded-full border bg-white px-4">合成写真を選ぶ</button></div>:null}
      <input type="hidden" name="sessionId" value={recordingSessionId} />
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
          {state.recoveryHref?<Link href={state.recoveryHref} className="mt-2 block underline">保存済みの記録を開いて確認・編集</Link>:null}
        </div>
      ) : null}

      {draftOwnerId ? (
        <p role="status" aria-live="polite" className="text-sm text-slate-500">
          {!draftReady ? "下書きを確認しています..." : pending ? "思い出を保存しています..." : draftNotice}
        </p>
      ) : null}
      <div aria-label="記録先の確認" className={`${photoEntry?"hidden":"sticky top-0 z-30 flex"} flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d9dfd0] bg-[#fffcf5]/95 p-3 text-sm shadow-sm backdrop-blur`}>
        <div><p className="text-xs text-[#496250]">{selectedDay?.visit_date??visitDate??'この来場日'} · {activityTypeMeta.label}</p><p className="font-semibold text-[#234b3b]">{mapPoint?"地図上の写真の位置を指定済み":selectedPavilion?.name??(showPavilionPicker?'訪問した場所を指定してください':'施設に結びつけない記録')}</p></div>
        <a onClick={()=>{const panel=document.getElementById("photo-location-options");if(panel instanceof HTMLDetailsElement)panel.open=true;}} href="#photo-location-options" className="inline-flex min-h-11 items-center rounded-full border border-[#a7b6a0] px-3 font-semibold text-[#234b3b]">{selectedPavilion?'場所を変更':'場所を指定'}</a>
      </div>
      <fieldset disabled={pending || !draftReady} className={pending ? "opacity-70" : undefined}>
        <section className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50/80">
          <div className="space-y-4 border-b border-slate-200 bg-[#fffcf5] px-5 py-5">
            <p className="text-sm font-semibold">{photoEntry?"写真":"写真から記録を始める（省略可）"}</p>
            {mode==="edit"?<p className="text-xs text-slate-500">保存済みの写真は、新しい写真を選んで保存するまで変更されません。</p>:null}
            {showPhotoInput ? (
              <div>
                <details open={!selectedPhoto||photoNeedsReselect}><summary className="mb-3 cursor-pointer text-sm font-semibold">{selectedPhoto?"写真を差し替える":"写真を撮る・選ぶ"}</summary>
                <label
                  htmlFor="photo"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  写真を撮る・選ぶ（任意）
                </label>
                <input
                  ref={(input) => {
                    photoInputRef.current = input;
                    if (input) {
                      // 種類を戻したときも、表示中のファイルと送信する File を一致させる。
                      const files = new DataTransfer();
                      if (selectedPhoto) files.items.add(selectedPhoto);
                      input.files = files.files;
                    }
                  }}
                  id="photo"
                  disabled={Boolean(fixtureAdapter)}
                  name="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => { const file=event.target.files?.[0]; if(file) choosePhoto(file); }}
                  className={fieldClass(Boolean(state.fieldErrors.photo))}
                />
                <label className="mt-3 inline-flex cursor-pointer rounded-full border bg-white px-4 py-2 text-sm">カメラで撮影
                  <input type="file" disabled={Boolean(fixtureAdapter)} accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" aria-label="カメラで撮影" onChange={event=>{const file=event.target.files?.[0];if(file)choosePhoto(file,"camera");event.target.value='';}} />
                </label>
                </details>
                <SelectedPhotoPreview photo={selectedPhoto} />
                {selectedPhoto||photoNeedsReselect?<button type="button" onClick={removeSelectedPhoto} className="ml-3 rounded-full border px-4 py-2 text-sm">選択した写真を取り消す</button>:null}
                {selectedPhoto ? <p className="mt-2 text-sm text-slate-600">選択中: {selectedPhoto.name} · {activityTypeMeta.label}</p> : null}
                {photoNeedsReselect ? (
                  <p className="mt-2 text-sm text-amber-700">
                    写真はもう一度選択してください。写真本体は下書きに保存されません。
                  </p>
                ) : null}
                {state.fieldErrors.photo ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {state.fieldErrors.photo}
                  </p>
                ) : null}
              </div>
            ) : null}


            <label className="block text-sm font-medium">来場日
              {mode==='create'&&visitSessions.length>0 ? <select id="recording-session" aria-label="記録する来場日" value={recordingSessionId} onChange={event=>{setRecordingSessionId(event.target.value);persistDraft({recordingSessionId:event.target.value});}} className="mt-2 block w-full rounded-xl border bg-white p-3">{!recordingSessionId?<option value="" disabled>来場日を選んでください</option>:null}{visitSessions.map(day=><option key={day.id} value={day.id}>{day.visit_date}</option>)}</select> : <span className="ml-3">{visitDate??'この来場日'}</span>}
            </label>
            {photoEntry?<p className="text-xs text-slate-600">この写真をどの来場日の思い出として残すかを選びます。地図の表示範囲は変わりません。</p>:null}
          </div>
          <details open={!photoEntry||Boolean(state.fieldErrors.activityType)} className="border-b border-slate-200 bg-white/80 px-5 py-5"><summary className="cursor-pointer text-sm font-semibold">種類を変更 · {activityTypeMeta.label}</summary><p className="mt-2 text-xs text-slate-600">フードやピンバッジとして分類したい場合だけ変更します。</p>
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
                        className={`flex h-full min-h-20 flex-col items-start justify-between rounded-3xl border px-4 py-4 text-left transition ${
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
          </details>

          <div className="space-y-5 px-5 py-5">
            <details id="photo-location-options" open={!photoEntry||showPavilionPicker||Boolean(state.fieldErrors.pavilionId)}><summary className="cursor-pointer rounded-xl border bg-white p-3 text-sm font-semibold">場所を確認・変更 · {mapPoint?"地図で指定済み":selectedPavilion?.name??"あとで指定"}</summary><p className="my-3 text-xs text-slate-600">地図でタップした位置はそのまま保存します。施設名やGPS候補を選び直す必要はありません。</p>
            <div className="flex flex-wrap gap-2" aria-label="最近の場所">
              {[...new Set([selectedPavilionId,...recentPavilionIds,...Object.values(draftsRef.current).map(draft=>draft.pavilionId)].filter(Boolean))].slice(0,5).map(id=>{const place=pavilions.find(p=>p.id===id);return place?<button type="button" key={id} onClick={()=>choosePlace(id)} className="rounded-full border border-[#c6d3c4] bg-[#f2f6ee] px-4 py-2 text-sm">{place.name}</button>:null;})}
            </div>
            {isRegisteredEvent(placeRegistry,recordingEventId)?<p className="text-xs text-slate-600">既存の施設も引き続き選べます。公式台帳との同一性が未確認の施設は、公式の達成対象へ自動的に割り当てません。</p>:null}
            {mapPointAvailable&&recordingEventId==='e60f2360-8147-4112-969a-00954596ceb6'&&!showPavilionPicker?<section aria-label="写真の地図位置" className="rounded-2xl border border-[#c7d4bd] bg-[#fffcf5] p-4"><p className="font-semibold">施設以外の場所にも写真を残せます</p><p className="my-2 text-xs">{mapPoint?'位置を指定済み。保存するまでは記録に反映されません。':'道路やパレードの写真は、施設を選ばず地図で指定できます。あとで指定しても記録は残ります。'}</p><button type="button" disabled={pending} onClick={()=>setPointPicker(mapPoint?{...mapPoint,confirmed:false}:null)} className="min-h-11 rounded-full border px-4">{mapPoint?'地図の位置を直す':'地図で写真の位置を選ぶ'}</button>{mapPoint?<button type="button" disabled={pending} onClick={()=>{setMapPoint(null);persistDraft({mapPoint:null});}} className="ml-2 min-h-11 rounded-full border px-4">地図の位置はあとで指定</button>:null}</section>:null}
            <PhotoLocationSuggestions deviceLocationEnabled={!fixtureAdapter} photoOrigin={selectedPhoto?photoOrigin:mode==="edit"?"gallery":"none"} onPointSuggest={mapPointAvailable&&!showPavilionPicker?draft=>setPointPicker(draft):undefined} photo={selectedPhoto} pavilions={availablePavilions} eventId={recordingEventId} visitDate={selectedDay?.visit_date??visitDate??''} onSelect={choosePlace} onContextSelect={(id,context)=>{const parsed=decodePlaceContext(context);if(!parsed.ok)return;const place=availablePavilions.find(p=>p.id===id);if(!place)return;choosePlace(id);setPlaceContext(parsed.value);persistDraft({pavilionId:id,pavilionSearch:place.name,title:activityType==='pavilion_visit'?place.name:title,placeContext:parsed.value});}} disabled={pending} />
            {placeContext?<div className="rounded-xl border p-3"><PlaceContextSummary context={placeContext}/><button type="button" disabled={pending} onClick={()=>{setPlaceContext(null);persistDraft({placeContext:null});}} className="mt-2 text-sm underline">場所の詳細を取り消す</button></div>:null}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
              <label htmlFor="pavilion-search" className="block text-sm font-medium">場所を選ぶ・変更する{showPavilionPicker?'（訪問は必須）':'（任意）'}</label>
              <p className="text-sm text-[#315e4b]">{selectedPavilion?'選択中: '+selectedPavilion.name:'場所はあとで指定できます。'} 関連グッズだけでは訪問済みになりません。{!placeCompatible?" この場所は選択したイベントの施設として未対応です。":null}</p>
              <input id="pavilion-search" type="text" value={pavilionSearch} placeholder="場所の名前で絞り込む" onChange={event=>{setPavilionSearch(event.target.value);persistDraft({pavilionSearch:event.target.value});}} className={fieldClass(false)} />
              <label htmlFor="related-place" className="sr-only">場所の一覧</label>
              <select id="related-place" value={selectedPavilionId} className={fieldClass(Boolean(state.fieldErrors.pavilionId))} onChange={event=>choosePlace(event.target.value)}>
                <option value="">場所は後で</option>
                {selectedPavilion&&!filteredPavilions.some(p=>p.id===selectedPavilion.id)?<option value={selectedPavilion.id}>{selectedPavilion.name}</option>:null}
                {filteredPavilions.map(place=><option key={place.id} value={place.id}>{place.name}</option>)}
              </select>
              {hasPavilionSearch&&filteredPavilions.length===0?<p className="text-xs text-slate-500">一致する場所はありません。名前を消すと一覧に戻れます。</p>:null}
              {state.fieldErrors.pavilionId?<p className="text-sm text-rose-600">{state.fieldErrors.pavilionId}</p>:null}
              {!showPavilionPicker&&selectedPavilion?<button type="button" disabled={pending} onClick={()=>choosePlace('')} className="min-h-11 rounded-full border px-4 text-sm font-semibold">施設に結びつけずに記録する</button>:null}
              {!showPavilionPicker?<p className="text-xs leading-5 text-slate-600">園路のパレードなど、施設を選ばない写真も保存できます。{mapPointAvailable?"地図でも自分で位置を指定できます。施設へ自動で移動させません。":"道路上の任意点への配置は準備中なので、施設へ自動で移動させません。"}</p>:null}
              {showPavilionPicker?<p className="text-xs text-slate-500">訪問の記録には場所が必要です。場所を後で決める場合は、フード・グッズ・イベントで記録してください。</p>:null}
            </div>
            </details>
            {showPavilionPicker ? <input type="hidden" name="title" value={title} /> : (
              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  {photoEntry&&activityType==='event_participation'?"写真の名前":activityTypeMeta.titleLabel}
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    persistDraft({ title: event.target.value });
                    clearFieldState("title");
                  }}
                  placeholder={activityTypeMeta.titlePlaceholder}
                  className={fieldClass(Boolean(state.fieldErrors.title))}
                />
                {photoEntry?<p className="mt-2 text-xs text-slate-600">あとで写真を探すための短い名前です。そのままでも保存できます。</p>:null}
                {state.fieldErrors.title ? (
                  <p className="mt-2 text-sm text-rose-600">
                    {state.fieldErrors.title}
                  </p>
                ) : null}
              </div>
            )}

            <details open={!photoEntry||Boolean(state.fieldErrors.occurredAt||state.fieldErrors.price||state.fieldErrors.acquisitionMethod||state.fieldErrors.memo)}><summary className="cursor-pointer rounded-xl border bg-white p-3 text-sm font-semibold">メモ・時刻などを追加（任意）</summary><p className="my-3 text-xs text-slate-600">名前と写真だけでも保存できます。時刻は並び順、メモは振り返り、金額は購入の記録に使います。</p>
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
                  persistDraft({ occurredAt: event.target.value });
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
                    persistDraft({ price: event.target.value });
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
                            persistDraft({ acquisitionMethod: option.value });
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
                  persistDraft({ memo: event.target.value });
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
            </details>
          </div>
        </section>
      </fieldset>

      <div className="sticky bottom-2 z-20 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <button
          type="submit"
          disabled={!draftReady || pending || !recordingSessionId || (mode === "edit" && !isDirty)}
          className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {pending
            ? "保存中..."
            : submitLabel ?? (mode === "edit" ? "保存する" : "記録する")}
        </button>
        {mode === "create" ? (
          <span className="text-sm text-slate-500">
            {returnToMap?"保存すると、元の地図の表示範囲を保って記録を開きます。":"保存すると、この来場日のタイムラインに戻ります。"}
          </span>
        ) : null}
        {cancelHref ? (
          <Link
            href={cancelHref}
            onClick={()=>persistDraft()}
            className="inline-flex w-full items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-900 hover:text-slate-900"
          >
            {cancelLabel ?? "キャンセル"}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
