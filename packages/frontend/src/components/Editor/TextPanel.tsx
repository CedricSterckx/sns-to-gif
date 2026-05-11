import type { TextOverlay } from '../../types/job.types';

interface TextPanelProps {
  overlays: TextOverlay[];
  trimStart: number;
  trimEnd: number;
  onChange: (overlays: TextOverlay[]) => void;
}

const defaultOverlay = (): TextOverlay => ({
  text: '',
  x: 10,
  y: 80,
  fontSize: 28,
  color: '#ffffff',
});

export function TextPanel({ overlays, trimStart, trimEnd, onChange }: TextPanelProps) {
  function add() {
    onChange([...overlays, { ...defaultOverlay(), startSec: trimStart, endSec: trimEnd }]);
  }

  function remove(i: number) {
    onChange(overlays.filter((_, idx) => idx !== i));
  }

  function update(i: number, patch: Partial<TextOverlay>) {
    onChange(overlays.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }

  return (
    <div className="space-y-4">
      {overlays.map((overlay, i) => (
        <div key={i} className="rounded-lg border border-gray-200 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Text #{i + 1}</span>
            <button onClick={() => remove(i)} className="text-xs text-red-500 hover:text-red-700">
              Remove
            </button>
          </div>
          <input
            type="text"
            placeholder="Caption text..."
            value={overlay.text}
            onChange={(e) => update(i, { text: e.target.value })}
            className="w-full rounded border border-gray-200 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none"
          />
          <div className="grid grid-cols-3 gap-2">
            <label className="flex flex-col gap-1 text-xs text-gray-600">
              <span>X %</span>
              <input type="number" min={0} max={95} value={overlay.x} onChange={(e) => update(i, { x: Number(e.target.value) })}
                className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-600">
              <span>Y %</span>
              <input type="number" min={0} max={95} value={overlay.y} onChange={(e) => update(i, { y: Number(e.target.value) })}
                className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-gray-600">
              <span>Size</span>
              <input type="number" min={10} max={80} value={overlay.fontSize} onChange={(e) => update(i, { fontSize: Number(e.target.value) })}
                className="rounded border border-gray-200 px-2 py-1 text-sm focus:border-indigo-400 focus:outline-none" />
            </label>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <span>Color</span>
              <input type="color" value={overlay.color} onChange={(e) => update(i, { color: e.target.value })}
                className="h-7 w-10 cursor-pointer rounded border-0" />
            </label>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="w-full rounded-lg border-2 border-dashed border-gray-200 py-2 text-sm text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
      >
        + Add text overlay
      </button>
    </div>
  );
}
