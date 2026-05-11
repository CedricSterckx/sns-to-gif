interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropPanelProps {
  videoWidth: number;
  videoHeight: number;
  crop: CropRect | null;
  onChange: (crop: CropRect | null) => void;
}

export function CropPanel({ videoWidth, videoHeight, crop, onChange }: CropPanelProps) {
  const vw = videoWidth || 1280;
  const vh = videoHeight || 720;

  function handleChange(field: keyof CropRect, value: number) {
    const current = crop ?? { x: 0, y: 0, width: vw, height: vh };
    onChange({ ...current, [field]: value });
  }

  function reset() {
    onChange(null);
  }

  const c = crop ?? { x: 0, y: 0, width: vw, height: vh };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {(['x', 'y', 'width', 'height'] as const).map((field) => (
          <label key={field} className="flex flex-col gap-1 text-xs text-gray-600">
            <span className="font-medium uppercase">{field}</span>
            <input
              type="number"
              min={0}
              max={field === 'x' || field === 'width' ? vw : vh}
              value={c[field]}
              onChange={(e) => handleChange(field, Number(e.target.value))}
              className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onChange({ x: 0, y: 0, width: Math.round(vw / 2), height: Math.round(vh / 2) })}
          className="rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
        >
          Center crop 50%
        </button>
        <button
          onClick={reset}
          className="rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
        >
          Reset
        </button>
      </div>
      {crop && (
        <p className="text-xs text-gray-400">
          Cropping to {crop.width}×{crop.height} at ({crop.x},{crop.y})
        </p>
      )}
    </div>
  );
}
