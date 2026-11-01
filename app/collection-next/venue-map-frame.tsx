"use client";

import {separateMemorySymbols} from '@/lib/memory-map-symbols';
import Link from "next/link";
import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { VENUE_MAP_ASSET } from "./venue-map-config";

const MIN_ZOOM = 0.38;
const MAX_ZOOM = 4.2;
const DESKTOP_INITIAL_ZOOM = 1;
const MOBILE_INITIAL_ZOOM = 0.72;
const BUTTON_ZOOM_STEP = 0.28;
const DOUBLE_CLICK_ZOOM_STEP = 0.5;
const MINIMIZED_PAN_MARGIN_RATIO = 0.42;

export type MapArtwork = { href: string; viewBox: string; width: number; height: number };

type VenueMapFrameProps = {
  onMapTap?:(x:number,y:number)=>void;
  mapAsset?: MapArtwork;
  focusPlaceId?:string|null;
  badgeMarkers?: boolean;
  children: ReactNode;
  markers: VenueMapMarker[];
  renderPlaceDetail?: (id: string, onClose: () => void) => ReactNode;
};

export type VenueMapMarker = {
  memoryCount?: number;
  memoryDayCount?:number;
  paperMemory?:boolean;
  previewUrl?: string | null;
  photoCount?: number;
  id: string;
  name: string;
  x: number;
  y: number;
  areaId: string;
  areaName: string;
  visited: boolean;
  bloom: string;
  imageUrl: string | null;
  size: number;
  rotation: number;
  visitCount: number;
  firstVisitedAt: string | null;
  latestVisitedAt: string | null;
  latestSessionId: string | null;
};

type MapSize = {
  height: number;
  width: number;
};

type MapOffset = {
  x: number;
  y: number;
};

type TrackedPointer = {
  x: number;
  y: number;
};

type PinchStart = {
  distance: number;
  zoom: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getBaseMapSize(viewportElement: HTMLDivElement | null, asset: MapArtwork = VENUE_MAP_ASSET): MapSize {
  if (!viewportElement) {
    return { height: 0, width: 0 };
  }

  const viewportWidth = viewportElement.clientWidth;
  const baseWidth = asset === VENUE_MAP_ASSET ? Math.max(viewportWidth, 980) : Math.min(viewportWidth, (viewportElement.clientHeight - 24) * asset.width / asset.height);

  return {
    width: baseWidth,
    height: baseWidth * (asset.height / asset.width),
  };
}

function clampOffset({
  offset,
  size,
  viewport,
  zoom,
}: {
  offset: MapOffset;
  size: MapSize;
  viewport: HTMLDivElement | null;
  zoom: number;
}) {
  if (!viewport) {
    return offset;
  }

  const scaledWidth = size.width * zoom;
  const scaledHeight = size.height * zoom;
  const horizontalPanMargin = viewport.clientWidth * MINIMIZED_PAN_MARGIN_RATIO;
  const verticalPanMargin = viewport.clientHeight * MINIMIZED_PAN_MARGIN_RATIO;
  const minX = viewport.clientWidth - scaledWidth - horizontalPanMargin;
  const maxX = horizontalPanMargin;
  const minY = viewport.clientHeight - scaledHeight - verticalPanMargin;
  const maxY = verticalPanMargin;

  return {
    x: clamp(offset.x, minX, maxX),
    y: clamp(offset.y, minY, maxY),
  };
}

function getViewportCenterOffset({
  focusX,
  focusY,
  size,
  viewport,
  zoom,
}: {
  focusX: number;
  focusY: number;
  size: MapSize;
  viewport: HTMLDivElement | null;
  zoom: number;
}) {
  if (!viewport) {
    return { x: 0, y: 0 };
  }

  return clampOffset({
    offset: {
      x: viewport.clientWidth / 2 - focusX * zoom,
      y: viewport.clientHeight / 2 - focusY * zoom,
    },
    size,
    viewport,
    zoom,
  });
}

function getFitZoom(size: MapSize, viewport: HTMLDivElement | null) {
  if (!viewport || size.width === 0 || size.height === 0) {
    return DESKTOP_INITIAL_ZOOM;
  }

  return clamp(
    Math.min(
      viewport.clientWidth / size.width,
      viewport.clientHeight / size.height,
    ) * 0.94,
    MIN_ZOOM,
    DESKTOP_INITIAL_ZOOM,
  );
}

function getPointerDistance(left: TrackedPointer, right: TrackedPointer) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function getPointerCenter(left: TrackedPointer, right: TrackedPointer) {
  return {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
  };
}

function getFirstTwoPointers(pointers: Map<number, TrackedPointer>) {
  return Array.from(pointers.values()).slice(0, 2);
}

function formatMapDate(value: string | null) {
  if (!value) {
    return "未記録";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未記録";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function getMarkerCentroid(markers: VenueMapMarker[]) {
  const focusMarkers = markers.some((marker) => marker.visited)
    ? markers.filter((marker) => marker.visited)
    : markers;

  if (focusMarkers.length === 0) {
    return {
      x: VENUE_MAP_ASSET.width / 2,
      y: VENUE_MAP_ASSET.height / 2,
    };
  }

  return {
    x:
      focusMarkers.reduce((total, marker) => total + marker.x, 0) /
      focusMarkers.length,
    y:
      focusMarkers.reduce((total, marker) => total + marker.y, 0) /
      focusMarkers.length,
  };
}

function VenueMapMarkerView({ marker, position, onSelect, badgeMarkers, disabled=false,showPlaceLabel=false }: {
  badgeMarkers?: boolean;
  showPlaceLabel?:boolean;
  disabled?:boolean;
  marker: VenueMapMarker;
  position: { x: number; y: number };
  onSelect: (marker: VenueMapMarker) => void;
}) {
  const markerStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    "--marker-bloom": marker.bloom,
    transform: `translate(-50%, -50%) rotate(${marker.rotation}deg) scale(${marker.size})`,
  } as CSSProperties;

  if(marker.paperMemory){
    if(!marker.memoryCount)return <button disabled={disabled} type="button" aria-label={`${marker.name}（記録なし）`} title={marker.name} onClick={()=>onSelect(marker)} onPointerDown={event=>event.stopPropagation()} className="absolute z-10 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline-2" style={{left:position.x,top:position.y}}><span aria-hidden="true" className="mx-auto block h-4 w-4 rounded-full border-2 border-white bg-[#34664d] shadow-sm"/>{showPlaceLabel?<span className="absolute left-1/2 top-9 w-max max-w-48 -translate-x-1/2 rounded-full border border-[#d7dfcf] bg-[#fffdf4] px-2 py-1 text-xs font-bold text-[#234c3f]">{marker.name}</span>:null}</button>;
    return <button disabled={disabled} type="button" aria-label={`${marker.name}（${marker.visited?'訪問済み':'訪問の記録なし'}） ${marker.memoryCount}件`} title={marker.name} onClick={()=>onSelect(marker)} onPointerDown={event=>event.stopPropagation()} className="absolute z-10 h-[76px] w-[76px] -translate-x-1/2 -translate-y-1/2 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ed7567]" style={{left:position.x,top:position.y}}>
      {marker.previewUrl?<>{(marker.photoCount??1)>2?<span data-photo-layer="back" className="absolute left-2 top-0 h-14 w-14 -rotate-[12deg] rounded-xl border-[3px] border-white bg-[#e6bc84] shadow-md"/>:null}{(marker.photoCount??1)>1?<span data-photo-layer="middle" className="absolute left-3 top-0 h-14 w-14 rotate-[7deg] rounded-xl border-[3px] border-white bg-[#b5cec0] shadow-md"/>:null}<span data-photo-layer="photo" className="absolute left-1 top-0 h-14 w-14 overflow-hidden rounded-xl border-[3px] border-white bg-[#e7e4d4] shadow-md" style={{backgroundImage:`url("${marker.previewUrl}")`,backgroundPosition:'center',backgroundSize:'cover'}}/></>:null}
      <svg className={`absolute ${marker.previewUrl?'bottom-0 right-0 h-11 w-11':'inset-1 h-16 w-16'} drop-shadow-md`} viewBox="-36 -36 72 72" aria-hidden="true"><path d="M0 28 L0 -22 M0 1 Q-30 -23 -23 -3 Q-18 18 0 10 M0 -8 Q26 -30 24 -9 Q15 7 0 1" fill="#dce7d4" stroke="#82a68c" strokeWidth="3"/><circle r="12" fill="#fff9ed"/><text textAnchor="middle" y="4" fontSize="11" fontWeight="700" fill="#35574b">{marker.memoryCount}</text></svg>
      {(marker.memoryDayCount??0)>1?<span className="absolute -right-1 -top-2 rounded-full border-2 border-white bg-[#245b49] px-2 py-0.5 text-[10px] font-bold text-white">{marker.memoryDayCount}日</span>:null}
    </button>;
  }
  if (badgeMarkers) {
    return <button disabled={disabled} type="button" aria-label={`${marker.name}（${marker.visited ? "訪問済み" : "未訪問"}）`} title={marker.name}
      onClick={() => onSelect(marker)} onPointerDown={event => event.stopPropagation()}
      className="absolute z-10 flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f46d60]"
      style={{ left: position.x, top: position.y }}>
      {marker.previewUrl ? <span className="mb-1 block h-14 w-14 overflow-hidden rounded-xl border-[3px] border-white bg-[#eee9dc] shadow-md" style={{ backgroundImage: `url("${marker.previewUrl}")`, backgroundSize: "cover", backgroundPosition: "center" }} /> : null}
      <span className={marker.memoryCount ? `rounded-full border-2 border-white px-2.5 py-1 text-xs font-bold shadow-sm ${marker.visited ? "bg-[#226354] text-white" : "bg-[#fff9ec] text-[#875b42]"}` : "h-3 w-3 rounded-full border-2 border-white bg-[#89a494]/75 shadow-sm"}>{marker.memoryCount ? `${marker.memoryCount}件` : null}</span>
    </button>;
  }

  if (!marker.visited) {
    return (
      <button disabled={disabled}
        type="button"
        aria-label={`${marker.name}（未訪問）`}
        className="venue-map-marker venue-map-marker-button venue-map-marker-unvisited"
        onClick={() => onSelect(marker)}
        onPointerDown={(event) => event.stopPropagation()}
        style={markerStyle}
        title={`${marker.name}（未訪問）`}
      />
    );
  }

  return (
    <button disabled={disabled}
      type="button"
      aria-label={`${marker.name}（訪問済み）`}
      className="venue-map-marker venue-map-marker-button venue-map-marker-visited"
      onClick={() => onSelect(marker)}
      onPointerDown={(event) => event.stopPropagation()}
      style={markerStyle}
      title={`${marker.name}（訪問済み）`}
    >
      <span className="venue-map-bloom-petal venue-map-bloom-petal-1" />
      <span className="venue-map-bloom-petal venue-map-bloom-petal-2" />
      <span className="venue-map-bloom-petal venue-map-bloom-petal-3" />
      <span className="venue-map-bloom-petal venue-map-bloom-petal-4" />
      <span className="venue-map-bloom-petal venue-map-bloom-petal-5" />
      <span className="venue-map-bloom-petal venue-map-bloom-petal-6" />
      <span className="venue-map-bloom-petal venue-map-bloom-petal-7" />
      <span className="venue-map-bloom-petal venue-map-bloom-petal-8" />
      <span
        className="venue-map-bloom-core"
        style={marker.imageUrl ? {
          backgroundImage: `url("${marker.imageUrl}")`,
        } : undefined}
      />
    </button>
  );
}

function VenueMapMarkerDetail({
  marker,
  onClose,
}: {
  marker: VenueMapMarker;
  onClose: () => void;
}) {
  return (
    <aside
      className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 border-t border-emerald-100 bg-white/94 px-5 py-4 shadow-[0_-14px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:bottom-6 sm:left-auto sm:right-6 sm:top-20 sm:flex sm:w-[340px] sm:flex-col sm:border sm:shadow-lg"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-emerald-700">
            {marker.areaName}
          </p>
          <h3 className="mt-1 break-words text-lg font-semibold leading-snug text-slate-950">
            {marker.name}
          </h3>
        </div>
        <button
          type="button"
          aria-label="詳細を閉じる"
          className="grid h-8 w-8 shrink-0 place-items-center border border-slate-200 bg-white text-lg leading-none text-slate-500 transition hover:border-slate-300 hover:text-slate-900"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {marker.visited ? (
        <>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm sm:grid-cols-1">
            <div className="bg-emerald-50 px-3 py-2">
              <dt className="text-[11px] font-medium text-emerald-700">訪問回数</dt>
              <dd className="mt-1 text-base font-semibold text-slate-950">
                {marker.visitCount}回
              </dd>
            </div>
            <div className="bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-medium text-slate-500">初回</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {formatMapDate(marker.firstVisitedAt)}
              </dd>
            </div>
            <div className="bg-slate-50 px-3 py-2">
              <dt className="text-[11px] font-medium text-slate-500">最新</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {formatMapDate(marker.latestVisitedAt)}
              </dd>
            </div>
          </dl>

          {marker.latestSessionId ? (
            <Link
              href={`/sessions/${marker.latestSessionId}`}
              className="mt-4 inline-flex w-full items-center justify-center bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              最新の来場日の記録を見る
            </Link>
          ) : null}
        </>
      ) : (
        <p className="mt-4 bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-600">
          まだ訪問していないパビリオンです。
        </p>
      )}
    </aside>
  );
}

export function VenueMapFrame({ children, markers, renderPlaceDetail, mapAsset = VENUE_MAP_ASSET, badgeMarkers = false, focusPlaceId=null, onMapTap }: VenueMapFrameProps) {
  const [zoom, setZoom] = useState(DESKTOP_INITIAL_ZOOM);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(()=>markers.some(m=>m.id===focusPlaceId)?focusPlaceId:null);
  const selectedMarker = markers.find((marker) => marker.id === selectedMarkerId) ?? null;
  const [mapSize, setMapSize] = useState<MapSize>({ height: 0, width: 0 });
  const [viewportSize, setViewportSize] = useState<MapSize>({ height: 0, width: 0 });
  const [offset, setOffset] = useState<MapOffset>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const hasInitializedViewportRef = useRef(false);
  const measuredViewportRef = useRef({width:0,height:0});
  const activePointersRef = useRef(new Map<number, TrackedPointer>());
  const tapStartRef=useRef<{id:number;x:number;y:number}|null>(null);
  const pinchStartRef = useRef<PinchStart | null>(null);
  const dragStartRef = useRef({
    clientX: 0,
    clientY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  useLayoutEffect(() => {
    function syncMapSize() {
      const viewportElement = viewportRef.current;
      const nextSize = getBaseMapSize(viewportElement, mapAsset);
      const nextViewportSize = {
        height: viewportElement?.clientHeight ?? 0,
        width: viewportElement?.clientWidth ?? 0,
      };
      const viewportChanged = measuredViewportRef.current.width !== nextViewportSize.width || measuredViewportRef.current.height !== nextViewportSize.height;
      measuredViewportRef.current = nextViewportSize;
      const shouldUseMobileStart =
        !hasInitializedViewportRef.current &&
        nextViewportSize.width < 640;
      const shouldInitializeViewport = !hasInitializedViewportRef.current;
      const nextZoom = shouldInitializeViewport
        ? badgeMarkers ? 1 : shouldUseMobileStart
          ? MOBILE_INITIAL_ZOOM
          : DESKTOP_INITIAL_ZOOM
        : clamp(zoom, MIN_ZOOM, MAX_ZOOM);

      if (shouldInitializeViewport && nextZoom !== zoom) {
        setZoom(nextZoom);
      }

      setViewportSize(nextViewportSize);
      setMapSize(nextSize);
      setOffset((currentOffset) => {
        if ((badgeMarkers && (shouldInitializeViewport || viewportChanged)) || shouldUseMobileStart) {
          const centroid = badgeMarkers ? { x: mapAsset.width / 2, y: mapAsset.height / 2 } : getMarkerCentroid(markers);

          return getViewportCenterOffset({
            focusX: nextSize.width * (centroid.x / mapAsset.width),
            focusY: nextSize.height * (centroid.y / mapAsset.height),
            size: nextSize,
            viewport: viewportElement,
            zoom: nextZoom,
          });
        }

        return clampOffset({
          offset: currentOffset,
          size: nextSize,
          viewport: viewportElement,
          zoom: nextZoom,
        });
      });
      hasInitializedViewportRef.current = true;
    }

    syncMapSize();
    window.addEventListener("resize", syncMapSize);

    return () => window.removeEventListener("resize", syncMapSize);
  }, [markers, zoom, mapAsset, badgeMarkers]);

  const zoomTo = useCallback((
    nextZoomValue: number,
    anchorClientX?: number,
    anchorClientY?: number,
  ) => {
    const viewportElement = viewportRef.current;
    const clampedZoom = Math.min(Math.max(nextZoomValue, MIN_ZOOM), MAX_ZOOM);

    if (!viewportElement || clampedZoom === zoom) {
      setZoom(clampedZoom);
      return;
    }

    const viewportRect = viewportElement.getBoundingClientRect();
    const anchorOffsetX = anchorClientX === undefined
      ? viewportElement.clientWidth / 2
      : anchorClientX - viewportRect.left;
    const anchorOffsetY = anchorClientY === undefined
      ? viewportElement.clientHeight / 2
      : anchorClientY - viewportRect.top;
    const mapAnchorX = (anchorOffsetX - offset.x) / zoom;
    const mapAnchorY = (anchorOffsetY - offset.y) / zoom;
    const nextOffset = {
      x: anchorOffsetX - mapAnchorX * clampedZoom,
      y: anchorOffsetY - mapAnchorY * clampedZoom,
    };

    setZoom(clampedZoom);
    setOffset(
      clampOffset({
        offset: nextOffset,
        size: mapSize,
        viewport: viewportElement,
        zoom: clampedZoom,
      }),
    );
  }, [mapSize, offset.x, offset.y, zoom]);

  const zoomBy = useCallback((
    delta: number,
    anchorClientX?: number,
    anchorClientY?: number,
  ) => {
    zoomTo(zoom + delta, anchorClientX, anchorClientY);
  }, [zoom, zoomTo]);

  const fitMap = useCallback(() => {
    const viewportElement = viewportRef.current;
    const nextZoom = getFitZoom(mapSize, viewportElement);

    setZoom(nextZoom);
    setOffset(
      getViewportCenterOffset({
        focusX: mapSize.width / 2,
        focusY: mapSize.height / 2,
        size: mapSize,
        viewport: viewportElement,
        zoom: nextZoom,
      }),
    );
  }, [mapSize]);

  const minimapViewport = viewportSize.width > 0 && viewportSize.height > 0
    ? {
        x: clamp((-offset.x / (mapSize.width * zoom)) * mapAsset.width, 0, mapAsset.width),
        y: clamp((-offset.y / (mapSize.height * zoom)) * mapAsset.height, 0, mapAsset.height),
        width: clamp((viewportSize.width / (mapSize.width * zoom)) * mapAsset.width, 0, mapAsset.width),
        height: clamp((viewportSize.height / (mapSize.height * zoom)) * mapAsset.height, 0, mapAsset.height),
      }
    : null;

  useEffect(() => {
    const viewportElement = viewportRef.current;

    if (!viewportElement) {
      return;
    }

    function handleNativeWheel(event: WheelEvent) {
      event.preventDefault();
      const nextZoomValue = zoom * Math.exp(-event.deltaY * 0.0016);
      zoomTo(nextZoomValue, event.clientX, event.clientY);
    }

    viewportElement.addEventListener("wheel", handleNativeWheel, {
      passive: false,
    });

    return () => {
      viewportElement.removeEventListener("wheel", handleNativeWheel);
    };
  }, [zoom, zoomTo]);

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    tapStartRef.current=activePointersRef.current.size===0?{id:event.pointerId,x:event.clientX,y:event.clientY}:null;
    event.currentTarget.setPointerCapture(event.pointerId);
    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (activePointersRef.current.size >= 2) {
      const [left, right] = getFirstTwoPointers(activePointersRef.current);

      pinchStartRef.current = {
        distance: getPointerDistance(left, right),
        zoom,
      };
      setIsDragging(false);
      return;
    }

    dragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const tap=tapStartRef.current;if(tap&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>8)tapStartRef.current=null;
    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (activePointersRef.current.size >= 2) {
      const [left, right] = getFirstTwoPointers(activePointersRef.current);
      const pinchStart = pinchStartRef.current;

      if (!pinchStart) {
        pinchStartRef.current = {
          distance: getPointerDistance(left, right),
          zoom,
        };
        return;
      }

      const nextDistance = getPointerDistance(left, right);
      const center = getPointerCenter(left, right);

      if (pinchStart.distance > 0) {
        zoomTo(
          pinchStart.zoom * (nextDistance / pinchStart.distance),
          center.x,
          center.y,
        );
      }

      return;
    }

    if (!isDragging) {
      return;
    }

    const dragStart = dragStartRef.current;
    const nextOffset = {
      x: dragStart.offsetX + (event.clientX - dragStart.clientX),
      y: dragStart.offsetY + (event.clientY - dragStart.clientY),
    };

    setOffset(
      clampOffset({
        offset: nextOffset,
        size: mapSize,
        viewport: viewportRef.current,
        zoom,
      }),
    );
  }

  function handlePointerEnd(event: PointerEvent<HTMLDivElement>) {
    const tap=tapStartRef.current;
    const isTap=event.type==='pointerup'&&tap?.id===event.pointerId&&activePointersRef.current.size===1&&Math.hypot(event.clientX-tap.x,event.clientY-tap.y)<=8;
    tapStartRef.current=null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointersRef.current.delete(event.pointerId);
    pinchStartRef.current = null;
    setIsDragging(false);
    if(isTap&&onMapTap&&mapSize.width>0){const r=event.currentTarget.getBoundingClientRect();const x=(event.clientX-r.left-offset.x)/(mapSize.width*zoom),y=(event.clientY-r.top-offset.y)/(mapSize.height*zoom);if(x>=0&&x<=1&&y>=0&&y<=1)onMapTap(x,y);}
  }

  const paperMode=markers.some(marker=>marker.paperMemory);
  const visibleMarkers=markers;
  const anchorPositions=new Map(visibleMarkers.map(marker=>[marker.id,{x:offset.x+mapSize.width*(marker.x/mapAsset.width)*zoom,y:offset.y+mapSize.height*(marker.y/mapAsset.height)*zoom}]));
  const separated=separateMemorySymbols(visibleMarkers.filter(marker=>marker.paperMemory&&Boolean(marker.memoryCount)).map(marker=>({id:marker.id,...anchorPositions.get(marker.id)!,radius:marker.previewUrl?38:34})),{left:offset.x,top:offset.y,right:offset.x+mapSize.width*zoom,bottom:offset.y+mapSize.height*zoom},70);
  const displayPositions=new Map(separated.map(p=>[p.id,p]));
  return (
    <div className="relative">
      {paperMode?<label className="block border-b border-[#e4ddca] bg-[#fffcf3] px-4 py-3 text-xs text-[#4e6a59]">場所を開く<select disabled={mapSize.width===0} aria-label="地図で場所を開く" value={selectedMarkerId??''} onChange={event=>{const marker=markers.find(m=>m.id===event.target.value);if(!marker)return;setSelectedMarkerId(marker.id);setOffset(getViewportCenterOffset({focusX:mapSize.width*marker.x/mapAsset.width,focusY:mapSize.height*marker.y/mapAsset.height,size:mapSize,viewport:viewportRef.current,zoom}));}} className="ml-2 max-w-[75%] rounded-full border border-[#dfd9c7] bg-white px-3 py-2"><option value="">記録のある場所、または施設を選ぶ</option>{markers.map(marker=><option key={marker.id} value={marker.id}>{marker.name}{marker.memoryCount?` · ${marker.memoryCount}件`:''}</option>)}</select></label>:null}
      <div className="absolute right-4 top-4 z-20 flex items-center gap-1 bg-white/75 px-2 py-1 shadow-sm ring-1 ring-slate-200/80 backdrop-blur sm:right-6 sm:top-6">
        <button
          type="button"
          aria-label="地図を縮小"
          className="grid h-8 w-8 place-items-center text-lg leading-none text-slate-600 transition hover:text-slate-950 disabled:cursor-default disabled:text-slate-300"
          disabled={mapSize.width===0||zoom <= MIN_ZOOM}
          onClick={() => zoomBy(-BUTTON_ZOOM_STEP)}
        >
          -
        </button>
        <span className="min-w-12 text-center text-xs font-semibold text-slate-500">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          disabled={mapSize.width===0} aria-label="地図全体を表示"
          className="grid h-8 min-w-10 place-items-center px-2 text-xs font-semibold text-slate-600 transition hover:text-slate-950"
          onClick={fitMap}
        >
          全体
        </button>
        <button
          type="button"
          aria-label="地図を拡大"
          className="grid h-8 w-8 place-items-center text-lg leading-none text-slate-600 transition hover:text-slate-950 disabled:cursor-default disabled:text-slate-300"
          disabled={mapSize.width===0||zoom >= MAX_ZOOM}
          onClick={() => zoomBy(BUTTON_ZOOM_STEP)}
        >
          +
        </button>
      </div>

      <div
        ref={viewportRef}
        className={[
          "relative h-[72svh] min-h-[520px] touch-none select-none overflow-hidden overscroll-contain sm:h-[78vh] sm:min-h-[500px]",
          isDragging ? "cursor-grabbing" : "cursor-grab",
        ].join(" ")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          className="absolute left-0 top-0 will-change-transform"
          onDoubleClick={(event) =>
            zoomBy(DOUBLE_CLICK_ZOOM_STEP, event.clientX, event.clientY)
          }
          style={{
            height: `${mapSize.height}px`,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            width: `${mapSize.width}px`,
          } as CSSProperties}
        >
          {children}
        </div>
        <div className="venue-map-marker-layer">
          {paperMode?<svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">{separated.filter(p=>Math.hypot(p.x-p.anchorX,p.y-p.anchorY)>3).map(p=><g key={p.id}><path d={`M${p.anchorX},${p.anchorY} L${p.x},${p.y}`} stroke="#6a8d79" strokeWidth="1" strokeDasharray="2 3" opacity=".7"/><circle cx={p.anchorX} cy={p.anchorY} r="2.5" fill="#356751"/></g>)}</svg>:null}
          {visibleMarkers.map((marker) => (
            <VenueMapMarkerView
              key={marker.id}
              marker={marker}
              showPlaceLabel={markers.length<=12}
              disabled={mapSize.width===0}
              badgeMarkers={badgeMarkers}
              onSelect={(marker) => setSelectedMarkerId(marker.id)}
              position={displayPositions.get(marker.id)??anchorPositions.get(marker.id)!}
            />
          ))}
        </div>
      </div>

        {selectedMarker && renderPlaceDetail ? renderPlaceDetail(selectedMarker.id, () => setSelectedMarkerId(null)) : selectedMarker ? (
          <VenueMapMarkerDetail
            marker={selectedMarker}
            onClose={() => setSelectedMarkerId(null)}
          />
        ) : null}

      {!badgeMarkers ? <div className="pointer-events-none absolute bottom-4 right-4 z-20 sm:bottom-6 sm:left-6 sm:right-auto">
        <div className="w-[104px] overflow-hidden bg-white/82 p-1.5 shadow-sm ring-1 ring-slate-200/80 backdrop-blur sm:w-[132px]">
          <svg
            aria-label="現在見ている地図範囲"
            className="block h-auto w-full"
            viewBox={mapAsset.viewBox}
            role="img"
          >
            <image
              href={mapAsset.href}
              x="0"
              y="0"
              width={mapAsset.width}
              height={mapAsset.height}
              preserveAspectRatio="xMidYMid meet"
              opacity="0.78"
            />
            {minimapViewport ? (
              <rect
                x={minimapViewport.x}
                y={minimapViewport.y}
                width={minimapViewport.width}
                height={minimapViewport.height}
                fill="rgba(16, 185, 129, 0.18)"
                stroke="#059669"
                strokeWidth="1.4"
              />
            ) : null}
          </svg>
        </div>
      </div> : null}
    </div>
  );
}
