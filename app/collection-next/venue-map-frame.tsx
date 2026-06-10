"use client";

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

type VenueMapFrameProps = {
  children: ReactNode;
  markers: VenueMapMarker[];
};

export type VenueMapMarker = {
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

function getBaseMapSize(viewportElement: HTMLDivElement | null): MapSize {
  if (!viewportElement) {
    return { height: 0, width: 0 };
  }

  const viewportWidth = viewportElement.clientWidth;
  const baseWidth = Math.max(viewportWidth, 980);

  return {
    width: baseWidth,
    height: baseWidth * (VENUE_MAP_ASSET.height / VENUE_MAP_ASSET.width),
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

  if (scaledWidth <= viewport.clientWidth && scaledHeight <= viewport.clientHeight) {
    return {
      x: (viewport.clientWidth - scaledWidth) / 2,
      y: (viewport.clientHeight - scaledHeight) / 2,
    };
  }

  if (scaledWidth <= viewport.clientWidth) {
    return {
      x: (viewport.clientWidth - scaledWidth) / 2,
      y: clamp(offset.y, viewport.clientHeight - scaledHeight, 0),
    };
  }

  if (scaledHeight <= viewport.clientHeight) {
    return {
      x: clamp(offset.x, viewport.clientWidth - scaledWidth, 0),
      y: (viewport.clientHeight - scaledHeight) / 2,
    };
  }

  const minX = Math.min(viewport.clientWidth - scaledWidth, 0);
  const minY = Math.min(viewport.clientHeight - scaledHeight, 0);

  return {
    x: clamp(offset.x, minX, 0),
    y: clamp(offset.y, minY, 0),
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

function VenueMapMarkerView({ marker, position, onSelect }: {
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

  if (!marker.visited) {
    return (
      <button
        type="button"
        aria-label={`${marker.name}（未訪問）`}
        className="venue-map-marker venue-map-marker-button venue-map-marker-unvisited"
        onClick={() => onSelect(marker)}
        style={markerStyle}
        title={`${marker.name}（未訪問）`}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`${marker.name}（訪問済み）`}
      className="venue-map-marker venue-map-marker-button venue-map-marker-visited"
      onClick={() => onSelect(marker)}
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
    <aside className="pointer-events-auto absolute bottom-0 left-0 right-0 z-30 border-t border-emerald-100 bg-white/94 px-5 py-4 shadow-[0_-14px_30px_rgba(15,23,42,0.12)] backdrop-blur sm:bottom-6 sm:left-auto sm:right-6 sm:w-[320px] sm:border sm:shadow-lg">
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
          <dl className="mt-4 grid grid-cols-3 gap-2 text-sm">
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

export function VenueMapFrame({ children, markers }: VenueMapFrameProps) {
  const [zoom, setZoom] = useState(DESKTOP_INITIAL_ZOOM);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedMarker, setSelectedMarker] = useState<VenueMapMarker | null>(null);
  const [mapSize, setMapSize] = useState<MapSize>({ height: 0, width: 0 });
  const [viewportSize, setViewportSize] = useState<MapSize>({ height: 0, width: 0 });
  const [offset, setOffset] = useState<MapOffset>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const hasInitializedViewportRef = useRef(false);
  const activePointersRef = useRef(new Map<number, TrackedPointer>());
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
      const nextSize = getBaseMapSize(viewportElement);
      const nextViewportSize = {
        height: viewportElement?.clientHeight ?? 0,
        width: viewportElement?.clientWidth ?? 0,
      };
      const shouldUseMobileStart =
        !hasInitializedViewportRef.current &&
        nextViewportSize.width < 640;
      const shouldInitializeViewport = !hasInitializedViewportRef.current;
      const nextZoom = shouldInitializeViewport
        ? shouldUseMobileStart
          ? MOBILE_INITIAL_ZOOM
          : DESKTOP_INITIAL_ZOOM
        : clamp(zoom, MIN_ZOOM, MAX_ZOOM);

      if (shouldInitializeViewport && nextZoom !== zoom) {
        setZoom(nextZoom);
      }

      setViewportSize(nextViewportSize);
      setMapSize(nextSize);
      setOffset((currentOffset) => {
        if (shouldUseMobileStart) {
          const centroid = getMarkerCentroid(markers);

          return getViewportCenterOffset({
            focusX: nextSize.width * (centroid.x / VENUE_MAP_ASSET.width),
            focusY: nextSize.height * (centroid.y / VENUE_MAP_ASSET.height),
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
  }, [markers, zoom]);

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
        x: clamp((-offset.x / (mapSize.width * zoom)) * VENUE_MAP_ASSET.width, 0, VENUE_MAP_ASSET.width),
        y: clamp((-offset.y / (mapSize.height * zoom)) * VENUE_MAP_ASSET.height, 0, VENUE_MAP_ASSET.height),
        width: clamp((viewportSize.width / (mapSize.width * zoom)) * VENUE_MAP_ASSET.width, 0, VENUE_MAP_ASSET.width),
        height: clamp((viewportSize.height / (mapSize.height * zoom)) * VENUE_MAP_ASSET.height, 0, VENUE_MAP_ASSET.height),
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
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    activePointersRef.current.delete(event.pointerId);
    pinchStartRef.current = null;
    setIsDragging(false);
  }

  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-1 bg-white/75 px-2 py-1 shadow-sm ring-1 ring-slate-200/80 backdrop-blur sm:right-6 sm:top-6">
        <button
          type="button"
          aria-label="地図を縮小"
          className="grid h-8 w-8 place-items-center text-lg leading-none text-slate-600 transition hover:text-slate-950 disabled:cursor-default disabled:text-slate-300"
          disabled={zoom <= MIN_ZOOM}
          onClick={() => zoomBy(-BUTTON_ZOOM_STEP)}
        >
          -
        </button>
        <span className="min-w-12 text-center text-xs font-semibold text-slate-500">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          aria-label="地図全体を表示"
          className="grid h-8 min-w-10 place-items-center px-2 text-xs font-semibold text-slate-600 transition hover:text-slate-950"
          onClick={fitMap}
        >
          全体
        </button>
        <button
          type="button"
          aria-label="地図を拡大"
          className="grid h-8 w-8 place-items-center text-lg leading-none text-slate-600 transition hover:text-slate-950 disabled:cursor-default disabled:text-slate-300"
          disabled={zoom >= MAX_ZOOM}
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
          {markers.map((marker) => (
            <VenueMapMarkerView
              key={marker.id}
              marker={marker}
              onSelect={setSelectedMarker}
              position={{
                x: offset.x + mapSize.width * (marker.x / VENUE_MAP_ASSET.width) * zoom,
                y: offset.y + mapSize.height * (marker.y / VENUE_MAP_ASSET.height) * zoom,
              }}
            />
          ))}
        </div>
        {selectedMarker ? (
          <VenueMapMarkerDetail
            marker={selectedMarker}
            onClose={() => setSelectedMarker(null)}
          />
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 z-20 sm:hidden">
        <div className="w-[104px] overflow-hidden bg-white/82 p-1.5 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
          <svg
            aria-label="現在見ている地図範囲"
            className="block h-auto w-full"
            viewBox={VENUE_MAP_ASSET.viewBox}
            role="img"
          >
            <image
              href={VENUE_MAP_ASSET.href}
              x="0"
              y="0"
              width={VENUE_MAP_ASSET.width}
              height={VENUE_MAP_ASSET.height}
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
      </div>
    </div>
  );
}
