"use client";

import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { VENUE_MAP_ASSET } from "./venue-map-config";

const MIN_ZOOM = 1;
const MAX_ZOOM = 2.6;
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

function VenueMapMarkerView({ marker, position }: {
  marker: VenueMapMarker;
  position: { x: number; y: number };
}) {
  const markerStyle = {
    left: `${position.x}px`,
    top: `${position.y}px`,
    "--marker-bloom": marker.bloom,
    transform: `translate(-50%, -50%) rotate(${marker.rotation}deg)`,
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
  const [offset, setOffset] = useState<MapOffset>({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({
    clientX: 0,
    clientY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  useLayoutEffect(() => {
    function syncMapSize() {
      const nextSize = getBaseMapSize(viewportRef.current);
      setMapSize(nextSize);
      setOffset((currentOffset) =>
        clampOffset({
          offset: currentOffset,
          size: nextSize,
          viewport: viewportRef.current,
          zoom,
        }),
      );
    }

    syncMapSize();
    window.addEventListener("resize", syncMapSize);

    return () => window.removeEventListener("resize", syncMapSize);
  }, [zoom]);

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
          "relative h-[78vh] min-h-[500px] touch-none select-none overflow-hidden overscroll-contain",
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
    </div>
  );
}
