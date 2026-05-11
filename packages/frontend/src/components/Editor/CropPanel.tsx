import type { CropRect } from '../VideoPreview/CropOverlay';

interface CropPanelProps {
  videoWidth: number;
  videoHeight: number;
  crop: CropRect | null;
  onChange: (crop: CropRect | null) => void;
}

const ASPECT_RATIOS = [
  { label: '16 : 9',  w: 16, h: 9  },
  { label: '4 : 3',   w: 4,  h: 3  },
  { label: '1 : 1',   w: 1,  h: 1  },
  { label: '9 : 16',  w: 9,  h: 16 },
  { label: '4 : 5',   w: 4,  h: 5  },
];

const ZOOM_STEP = 0.15; // 15 % per click

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

export function CropPanel({ videoWidth, videoHeight, crop, onChange }: CropPanelProps) {
  const vw = videoWidth  || 1280;
  const vh = videoHeight || 720;

  // Zoom in: shrink crop toward center (magnify)
  function zoomIn() {
    const c = crop ?? { x: 0, y: 0, width: vw, height: vh };
    const nw = Math.max(40, Math.round(c.width  * (1 - ZOOM_STEP)));
    const nh = Math.max(40, Math.round(c.height * (1 - ZOOM_STEP)));
    const nx = clamp(Math.round(c.x + (c.width  - nw) / 2), 0, vw - nw);
    const ny = clamp(Math.round(c.y + (c.height - nh) / 2), 0, vh - nh);
    onChange({ x: nx, y: ny, width: nw, height: nh });
  }

  // Zoom out: grow crop from center (see more)
  function zoomOut() {
    const c = crop ?? { x: 0, y: 0, width: vw, height: vh };
    const nw = Math.min(vw, Math.round(c.width  * (1 + ZOOM_STEP)));
    const nh = Math.min(vh, Math.round(c.height * (1 + ZOOM_STEP)));
    const nx = clamp(Math.round(c.x - (nw - c.width)  / 2), 0, vw - nw);
    const ny = clamp(Math.round(c.y - (nh - c.height) / 2), 0, vh - nh);
    onChange({ x: nx, y: ny, width: nw, height: nh });
  }

  function applyAspect(aw: number, ah: number) {
    const c = crop ?? { x: 0, y: 0, width: vw, height: vh };
    const cx = c.x + c.width  / 2;
    const cy = c.y + c.height / 2;
    // Fit the target ratio inside the current crop area
    const ratio = aw / ah;
    let nw = c.width;
    let nh = Math.round(nw / ratio);
    if (nh > c.height) { nh = c.height; nw = Math.round(nh * ratio); }
    nw = Math.max(40, nw); nh = Math.max(40, nh);
    const nx = clamp(Math.round(cx - nw / 2), 0, vw - nw);
    const ny = clamp(Math.round(cy - nh / 2), 0, vh - nh);
    onChange({ x: nx, y: ny, width: nw, height: nh });
  }

  const zoomPct = crop
    ? Math.round(((vw * vh) / (crop.width * crop.height)) * 100)
    : 100;

  return (
    <div className="space-y-5">
      {/* Instruction */}
      <p className="text-xs text-gray-500 leading-relaxed">
        Draw on the video to set the crop area. Drag the handles to resize, drag inside to move.
      </p>

      {/* Zoom controls */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">Zoom</p>
        <div className="flex items-center gap-3">
          <button
            onClick={zoomOut}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40"
            disabled={!crop || (crop.width >= vw && crop.height >= vh)}
            title="Zoom out"
          >
            −
          </button>

          <div className="flex-1 text-center">
            <span className="text-sm font-semibold text-gray-800">{zoomPct}%</span>
            {crop && (
              <p className="text-xs text-gray-400 mt-0.5">
                {crop.width} × {crop.height} px
              </p>
            )}
          </div>

          <button
            onClick={zoomIn}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-lg font-bold text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-40"
            disabled={crop ? (crop.width <= 40 || crop.height <= 40) : false}
            title="Zoom in"
          >
            +
          </button>
        </div>

        {/* Zoom slider */}
        <input
          type="range"
          min={10}
          max={100}
          value={crop ? Math.round((crop.width / vw) * 100) : 100}
          onChange={(e) => {
            const pct = Number(e.target.value) / 100;
            const nw  = Math.round(vw * pct);
            const nh  = Math.round(vh * pct);
            const c   = crop ?? { x: 0, y: 0, width: vw, height: vh };
            const nx  = clamp(Math.round(c.x + (c.width  - nw) / 2), 0, vw - nw);
            const ny  = clamp(Math.round(c.y + (c.height - nh) / 2), 0, vh - nh);
            onChange({ x: nx, y: ny, width: Math.max(40, nw), height: Math.max(40, nh) });
          }}
          className="mt-3 w-full accent-indigo-500"
        />
      </div>

      {/* Aspect ratio presets */}
      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">Aspect ratio</p>
        <div className="flex flex-wrap gap-2">
          {ASPECT_RATIOS.map(({ label, w, h }) => (
            <button
              key={label}
              onClick={() => applyAspect(w, h)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Position (read-only info + fine-tune) */}
      {crop && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-600">Position</p>
          <div className="grid grid-cols-2 gap-2">
            {(['x', 'y'] as const).map((field) => (
              <label key={field} className="flex flex-col gap-1 text-xs text-gray-500">
                <span className="font-medium uppercase">{field === 'x' ? 'Left (X)' : 'Top (Y)'}</span>
                <input
                  type="number"
                  min={0}
                  max={field === 'x' ? vw - (crop.width  || 1) : vh - (crop.height || 1)}
                  value={crop[field]}
                  onChange={(e) => onChange({ ...crop, [field]: Number(e.target.value) })}
                  className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        onClick={() => onChange(null)}
        className="w-full rounded-lg border border-gray-200 py-2 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500 transition-colors"
      >
        Remove crop
      </button>
    </div>
  );
}
