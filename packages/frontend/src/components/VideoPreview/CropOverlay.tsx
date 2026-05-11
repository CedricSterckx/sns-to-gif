import React, { useRef, useEffect, useCallback } from 'react';

export interface CropRect {
  x: number; y: number; width: number; height: number; // video-space pixels
}

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  crop: CropRect | null;
  onChange: (crop: CropRect) => void;
}

// Compute the sub-rect the video actually occupies inside its container
// (accounts for object-contain letterboxing / pillarboxing).
function getDisplayBounds(video: HTMLVideoElement) {
  const el = video.parentElement as HTMLElement;
  const cw = el.clientWidth;
  const ch = el.clientHeight;
  const vw = video.videoWidth  || 1;
  const vh = video.videoHeight || 1;
  const scale = Math.min(cw / vw, ch / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  return {
    left: (cw - dw) / 2,
    top:  (ch - dh) / 2,
    width: dw,
    height: dh,
    scaleX: scale,
    scaleY: scale,
  };
}

type HandleId = 'nw'|'n'|'ne'|'e'|'se'|'s'|'sw'|'w'|'body';

const HANDLES: { id: HandleId; cursor: string; xPct: number; yPct: number }[] = [
  { id: 'nw', cursor: 'nw-resize', xPct: 0,   yPct: 0   },
  { id: 'n',  cursor: 'n-resize',  xPct: 0.5, yPct: 0   },
  { id: 'ne', cursor: 'ne-resize', xPct: 1,   yPct: 0   },
  { id: 'e',  cursor: 'e-resize',  xPct: 1,   yPct: 0.5 },
  { id: 'se', cursor: 'se-resize', xPct: 1,   yPct: 1   },
  { id: 's',  cursor: 's-resize',  xPct: 0.5, yPct: 1   },
  { id: 'sw', cursor: 'sw-resize', xPct: 0,   yPct: 1   },
  { id: 'w',  cursor: 'w-resize',  xPct: 0,   yPct: 0.5 },
];

const H = 12; // handle size px
const MIN_PX = 40; // minimum crop size in video-space px

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function CropOverlay({ videoRef, crop, onChange }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // All drag state lives in a ref so event listeners don't need to re-register
  const drag = useRef<{
    handle: HandleId;
    startMx: number; startMy: number;
    startCrop: CropRect;
    bounds: ReturnType<typeof getDisplayBounds>;
    vw: number; vh: number;
  } | null>(null);

  const currentCrop = useCallback((): CropRect => {
    if (crop) return crop;
    const v = videoRef.current;
    return { x: 0, y: 0, width: v?.videoWidth ?? 640, height: v?.videoHeight ?? 360 };
  }, [crop, videoRef]);

  const beginDrag = useCallback((clientX: number, clientY: number, handle: HandleId, c: CropRect) => {
    const v = videoRef.current;
    if (!v?.videoWidth) return;
    drag.current = {
      handle, startMx: clientX, startMy: clientY,
      startCrop: { ...c },
      bounds: getDisplayBounds(v),
      vw: v.videoWidth, vh: v.videoHeight,
    };
  }, [videoRef]);

  // Global mousemove / mouseup (captured once, never re-registered)
  useEffect(() => {
    function move(e: MouseEvent) {
      const d = drag.current;
      if (!d) return;
      const { handle, startMx, startMy, startCrop: sc, bounds, vw, vh } = d;
      const dx = (e.clientX - startMx) / bounds.scaleX;
      const dy = (e.clientY - startMy) / bounds.scaleY;
      let { x, y, width, height } = sc;

      if (handle === 'body') { x += dx; y += dy; }
      else {
        if (handle.includes('w')) { x += dx; width -= dx; }
        if (handle.includes('e')) { width  += dx; }
        if (handle.includes('n')) { y += dy; height -= dy; }
        if (handle.includes('s')) { height += dy; }
      }

      width  = Math.max(MIN_PX, width);
      height = Math.max(MIN_PX, height);
      x = clamp(x, 0, vw - width);
      y = clamp(y, 0, vh - height);
      width  = Math.min(width,  vw - x);
      height = Math.min(height, vh - y);

      onChange({ x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) });
    }
    function up() { drag.current = null; }

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [onChange]);

  // Click on the background → start a fresh selection
  function handleOverlayDown(e: React.MouseEvent) {
    const v = videoRef.current;
    const ov = overlayRef.current;
    if (!v?.videoWidth || !ov) return;
    const bounds = getDisplayBounds(v);
    const rect   = ov.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (mx < bounds.left || mx > bounds.left + bounds.width ||
        my < bounds.top  || my > bounds.top  + bounds.height) return;

    const vx = Math.round((mx - bounds.left) / bounds.scaleX);
    const vy = Math.round((my - bounds.top)  / bounds.scaleY);
    const nc: CropRect = {
      x: clamp(vx, 0, v.videoWidth  - MIN_PX),
      y: clamp(vy, 0, v.videoHeight - MIN_PX),
      width: MIN_PX, height: MIN_PX,
    };
    onChange(nc);
    beginDrag(e.clientX, e.clientY, 'se', nc);
  }

  // Compute display-space box for rendering
  const v = videoRef.current;
  let box: { left: number; top: number; width: number; height: number } | null = null;
  if (v?.videoWidth && crop) {
    const b = getDisplayBounds(v);
    box = {
      left:   b.left   + crop.x      * b.scaleX,
      top:    b.top    + crop.y      * b.scaleY,
      width:  crop.width  * b.scaleX,
      height: crop.height * b.scaleY,
    };
  }

  return (
    <div
      ref={overlayRef}
      className="absolute inset-0 select-none"
      style={{ cursor: 'crosshair' }}
      onMouseDown={handleOverlayDown}
    >
      {/* No crop yet: instruction hint */}
      {!crop && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white">
            Click and drag on the video to select crop area
          </span>
        </div>
      )}

      {box && (
        <>
          {/* Dark vignette outside selection */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: box.left, top: box.top,
              width: box.width, height: box.height,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
              border: '2px solid rgba(255,255,255,0.9)',
              borderRadius: 2,
            }}
          />

          {/* Interactive crop box */}
          <div
            className="absolute"
            style={{ left: box.left, top: box.top, width: box.width, height: box.height, cursor: 'move' }}
            onMouseDown={(e) => { e.stopPropagation(); beginDrag(e.clientX, e.clientY, 'body', currentCrop()); }}
          >
            {/* Rule-of-thirds guides */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[1/3, 2/3].map((p) => (
                <React.Fragment key={p}>
                  <div className="absolute left-0 right-0 border-t border-white/30" style={{ top:  `${p*100}%` }} />
                  <div className="absolute top-0 bottom-0 border-l border-white/30" style={{ left: `${p*100}%` }} />
                </React.Fragment>
              ))}
            </div>

            {/* Resize handles */}
            {HANDLES.map(({ id, cursor, xPct, yPct }) => (
              <div
                key={id}
                className="absolute z-10 rounded-sm bg-white shadow-md"
                style={{
                  cursor,
                  width: H, height: H,
                  border: '2px solid #6366f1',
                  left: `calc(${xPct * 100}% - ${H / 2}px)`,
                  top:  `calc(${yPct * 100}% - ${H / 2}px)`,
                }}
                onMouseDown={(e) => { e.stopPropagation(); beginDrag(e.clientX, e.clientY, id, currentCrop()); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
