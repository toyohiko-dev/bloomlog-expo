"use client";

import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { VENUE_MAP_ASSET } from "./venue-map-config";

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.6;
const MOBILE_INITIAL_ZOOM = 1.35;
const BUTTON_ZOOM_STEP = 0.22;
const DOUBLE_CLICK_ZOOM_STEP = 0.35;

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
};

type MapSize = {
  height: number;
  width: number;
};

type MapOffset = {
  x: number;
  y: number;
};

type FocusTarget = {
  key: string;
  label: string;
  x: number;
  y: number;
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

function buildFocusTargets(markers: VenueMapMarker[]) {
  const grouped = new Map<string, {
    areaName: string;
    markers: VenueMapMarker[];
    visitedCount: number;
  }>();

  for (const marker of markers) {
    const current = grouped.get(marker.areaId) ?? {
      areaName: marker.areaName,
      markers: [],
      visitedCount: 0,
    };

    current.markers.push(marker);

    if (marker.visited) {
      current.visitedCount += 1;
    }

    grouped.set(marker.areaId, current);
  }

  const allCentroid = getMarkerCentroid(markers);
  const areaTargets = Array.from(grouped.entries())
    .map(([areaId, group]) => {
      const centroid = getMarkerCentroid(group.markers);

      return {
        key: areaId,
        label: group.areaName,
        x: centroid.x,
        y: centroid.y,
        zoom: MOBILE_INITIAL_ZOOM + 0.16,
        visitedCount: group.visitedCount,
        totalCount: group.markers.length,
      };
    })
    .sort((left, right) => {
      if (left.visitedCount !== right.visitedCount) {
        return right.visitedCount - left.visitedCount;
      }

      if (left.totalCount !== right.totalCount) {
        return right.totalCount - left.totalCount;
      }

      return left.label.localeCompare(right.label, "ja-JP");
    })
    .slice(0, 8)
    .map((target) => ({
      key: target.key,
      label: target.label,
      x: target.x,
      y: target.y,
      zoom: target.zoom,
    }));

  return [
    {
      key: "visited",
      label: "訪問済み",
      x: allCentroid.x,
      y: allCentroid.y,
      zoom: MOBILE_INITIAL_ZOOM,
    },
    ...areaTargets,
  ] satisfies FocusTarget[];
}

function VenueMapMarkerView({ marker, position }: {
  marker: VenueMapMarker;
  position: { x: number; y: number };
}) {
  const markerStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    "--marker-bloom": marker.bloom,
    transform: `translate(-50%, -50%) rotate(${marker.rotation}deg) scale(${marker.size})`,
  } as CSSProperties;

  if (!marker.visited) {
    return (
      <div
        aria-label={`${marker.name}（未訪問）`}
        className="venue-map-marker venue-map-marker-unvisited"
        role="img"
        style={markerStyle}
        title={`${marker.name}（未訪問）`}
      />
    );
  }

  return (
    <div
      aria-label={`${marker.name}（訪問済み）`}
      className="venue-map-marker venue-map-marker-visited"
      role="img"
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
    </div>
  );
}

export function VenueMapFrame({ children, markers }: VenueMapFrameProps) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [isDragging, setIsDragging] = useState(false);
  const [mapSize, setMapSize] = useState<MapSize>({ height: 0, width: 0 });
  const [viewportSize, setViewportSize] = useState<MapSize>({ height: 0, width: 0 });
  const [offset, setOffset] = useState<MapOffset>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const hasInitializedViewportRef = useRef(false);
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
        !hasInitializedViewportRef.current && nextViewportSize.width < 640;
      const nextZoom = shouldUseMobileStart ? MOBILE_INITIAL_ZOOM : zoom;

      if (shouldUseMobileStart) {
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

  const focusTargets = buildFocusTargets(markers);

  const focusMap = useCallback((target: FocusTarget) => {
    const viewportElement = viewportRef.current;
    const nextZoom = Math.min(Math.max(target.zoom, MIN_ZOOM), MAX_ZOOM);

    setZoom(nextZoom);
    setOffset(
      getViewportCenterOffset({
        focusX: mapSize.width * (target.x / VENUE_MAP_ASSET.width),
        focusY: mapSize.height * (target.y / VENUE_MAP_ASSET.height),
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
    dragStartRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
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
              position={{
                x: offset.x + mapSize.width * (marker.x / VENUE_MAP_ASSET.width) * zoom,
                y: offset.y + mapSize.height * (marker.y / VENUE_MAP_ASSET.height) * zoom,
              }}
            />
          ))}
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-4 left-4 right-4 z-20 sm:hidden">
        <div className="mb-3 ml-auto w-[104px] overflow-hidden bg-white/82 p-1.5 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
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

        <div className="flex gap-2 overflow-x-auto bg-white/82 px-2 py-2 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
          {focusTargets.map((target) => (
            <button
              key={target.key}
              type="button"
              className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm"
              onClick={() => focusMap(target)}
            >
              {target.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
