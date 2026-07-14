"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { WORLD_HEIGHT, WORLD_WIDTH } from "@/lib/worldmobilize/world-geometry";

/**
 * MapViewport — the camera. Wraps the world (an SVG rendered at fixed world
 * size) in a pannable/zoomable surface:
 *   - drag to pan (mouse, touch, pen — unified pointer events)
 *   - wheel zoom anchored to the cursor
 *   - two-finger pinch zoom anchored to the pinch midpoint
 *   - double-click zoom
 *   - imperative zoomIn/zoomOut/reset/flyTo for the toolbar and selection
 * Camera moves from buttons/flyTo are eased; direct manipulation is 1:1.
 * A click that follows a real drag is swallowed in the capture phase so
 * releasing a pan on a region never selects it.
 */

type Camera = { x: number; y: number; k: number };

export type MapCameraHandle = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
  /**
   * Ease the camera so world point (cx,cy) sits at anchorXRatio of the
   * viewport width. zoomFactor is relative to the fitted view (default 1.8
   * for region focus; use lower values for sector overviews).
   */
  flyTo: (cx: number, cy: number, opts?: { anchorXRatio?: number; zoomFactor?: number }) => void;
};

/** Zoom relative to the fitted view (1 = fully zoomed out). For label fades. */
const RelativeZoomContext = createContext(1);
export function useRelativeZoom(): number {
  return useContext(RelativeZoomContext);
}

const DRAG_CLICK_THRESHOLD_PX = 6;
const EASE = "transform 420ms cubic-bezier(0.22, 0.61, 0.36, 1)";

type Props = {
  children: ReactNode;
  className?: string;
  /** Content size in px — defaults to the world map; the city scene passes its own. */
  contentWidth?: number;
  contentHeight?: number;
};

const MapViewport = forwardRef<MapCameraHandle, Props>(function MapViewport(
  { children, className = "", contentWidth = WORLD_WIDTH, contentHeight = WORLD_HEIGHT },
  ref
) {
  // Content dims are fixed for the lifetime of a mount (world map or one city).
  const dims = useRef({ w: contentWidth, h: contentHeight });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [cam, setCam] = useState<Camera>({ x: 0, y: 0, k: 1 });
  const [animated, setAnimated] = useState(false);

  // Authoritative camera/size live in refs, written ONLY from handlers and
  // effects (never during render) — pointer streams read them without waiting
  // on React state. `cam`/`size` state mirrors them for rendering.
  const camRef = useRef(cam);
  const sizeRef = useRef(size);
  const fitKRef = useRef(1);
  const interactedRef = useRef(false);
  const animTimer = useRef<number | null>(null);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastPinchDist = useRef(0);
  const dragDist = useRef(0);
  const swallowClick = useRef(false);

  // Render-time fit uses the props directly (stable per mount); callbacks use
  // the dims ref so they never close over stale values.
  const fitK = size ? Math.min(size.w / contentWidth, size.h / contentHeight) * 0.94 : 1;

  const clampCam = useCallback((next: Camera): Camera => {
    const s = sizeRef.current;
    if (!s) return next;
    const fit = fitKRef.current;
    const k = Math.min(Math.max(next.k, fit * 0.7), fit * 10);
    const w = dims.current.w * k;
    const h = dims.current.h * k;
    // Let the map edges reach the viewport center, or stay centered when small.
    const xMin = Math.min(s.w / 2 - w, (s.w - w) / 2);
    const xMax = Math.max(s.w / 2, (s.w - w) / 2);
    const yMin = Math.min(s.h / 2 - h, (s.h - h) / 2);
    const yMax = Math.max(s.h / 2, (s.h - h) / 2);
    return {
      k,
      x: Math.min(Math.max(next.x, xMin), xMax),
      y: Math.min(Math.max(next.y, yMin), yMax),
    };
  }, []);

  const applyCam = useCallback(
    (next: Camera, ease: boolean) => {
      const clamped = clampCam(next);
      camRef.current = clamped;
      if (ease) {
        setAnimated(true);
        if (animTimer.current) window.clearTimeout(animTimer.current);
        animTimer.current = window.setTimeout(() => setAnimated(false), 450);
      } else {
        setAnimated(false);
      }
      setCam(clamped);
    },
    [clampCam]
  );

  const fitCam = useCallback((s: { w: number; h: number }): Camera => {
    const k = Math.min(s.w / dims.current.w, s.h / dims.current.h) * 0.94;
    return { k, x: (s.w - dims.current.w * k) / 2, y: (s.h - dims.current.h * k) / 2 };
  }, []);

  // Measure the container; keep the map fitted until the user interacts.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const s = { w: rect.width, h: rect.height };
      sizeRef.current = s;
      fitKRef.current = Math.min(s.w / dims.current.w, s.h / dims.current.h) * 0.94;
      setSize(s);
      if (!interactedRef.current) {
        const fitted = fitCam(s);
        camRef.current = fitted;
        setCam(fitted);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fitCam]);

  const zoomAt = useCallback(
    (px: number, py: number, factor: number, ease: boolean) => {
      interactedRef.current = true;
      const c = camRef.current;
      const fit = fitKRef.current;
      const k2 = Math.min(Math.max(c.k * factor, fit * 0.7), fit * 10);
      const ratio = k2 / c.k;
      applyCam({ k: k2, x: px - (px - c.x) * ratio, y: py - (py - c.y) * ratio }, ease);
    },
    [applyCam]
  );

  // Wheel zoom needs a non-passive listener to preventDefault page scroll.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      zoomAt(e.clientX - rect.left, e.clientY - rect.top, Math.exp(-e.deltaY * 0.0016), false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  useEffect(() => {
    return () => {
      if (animTimer.current) window.clearTimeout(animTimer.current);
    };
  }, []);

  const localPoint = (e: { clientX: number; clientY: number }) => {
    const rect = containerRef.current?.getBoundingClientRect();
    return { x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    containerRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, localPoint(e));
    dragDist.current = 0;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      lastPinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const pt = localPoint(e);
    pointers.current.set(e.pointerId, pt);

    if (pointers.current.size === 1) {
      const dx = pt.x - prev.x;
      const dy = pt.y - prev.y;
      dragDist.current += Math.hypot(dx, dy);
      if (dragDist.current > 0) interactedRef.current = true;
      const c = camRef.current;
      applyCam({ ...c, x: c.x + dx, y: c.y + dy }, false);
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      if (lastPinchDist.current > 0) {
        dragDist.current += Math.abs(dist - lastPinchDist.current);
        zoomAt(mid.x, mid.y, dist / lastPinchDist.current, false);
      }
      lastPinchDist.current = dist;
    }
  };

  const endPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    lastPinchDist.current = 0;
    if (dragDist.current > DRAG_CLICK_THRESHOLD_PX) swallowClick.current = true;
  };

  // A pan that ends on a region must not count as a region click.
  const onClickCapture = (e: React.MouseEvent) => {
    if (swallowClick.current) {
      e.preventDefault();
      e.stopPropagation();
      swallowClick.current = false;
    }
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    const pt = localPoint(e);
    zoomAt(pt.x, pt.y, 1.7, true);
  };

  useImperativeHandle(
    ref,
    (): MapCameraHandle => ({
      zoomIn: () => {
        const s = sizeRef.current;
        if (s) zoomAt(s.w / 2, s.h / 2, 1.45, true);
      },
      zoomOut: () => {
        const s = sizeRef.current;
        if (s) zoomAt(s.w / 2, s.h / 2, 1 / 1.45, true);
      },
      reset: () => {
        const s = sizeRef.current;
        if (!s) return;
        interactedRef.current = false;
        applyCam(fitCam(s), true);
      },
      flyTo: (cx, cy, opts) => {
        const s = sizeRef.current;
        if (!s) return;
        interactedRef.current = true;
        const c = camRef.current;
        const fit = fitKRef.current;
        const k = opts?.zoomFactor !== undefined
          ? fit * opts.zoomFactor
          : Math.max(c.k, fit * 1.8);
        const anchorX = s.w * (opts?.anchorXRatio ?? 0.5);
        applyCam({ k, x: anchorX - cx * k, y: s.h / 2 - cy * k }, true);
      },
    }),
    [applyCam, fitCam, zoomAt]
  );

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full touch-none select-none overflow-hidden cursor-grab active:cursor-grabbing ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onClickCapture={onClickCapture}
      onDoubleClick={onDoubleClick}
    >
      <div
        className="absolute left-0 top-0 will-change-transform"
        style={{
          width: contentWidth,
          height: contentHeight,
          transformOrigin: "0 0",
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.k})`,
          transition: animated ? EASE : "none",
        }}
      >
        <RelativeZoomContext.Provider value={fitK > 0 ? cam.k / fitK : 1}>
          {children}
        </RelativeZoomContext.Provider>
      </div>
    </div>
  );
});

export default MapViewport;
