interface OutputPanelProps {
  fps: number;
  quality: 'low' | 'medium' | 'high';
  resizeWidth: number | undefined;
  onChange: (patch: { fps?: number; quality?: 'low' | 'medium' | 'high'; resizeWidth?: number | undefined }) => void;
}

const FPS_OPTIONS = [8, 12, 15, 24];
const WIDTH_PRESETS = [
  { label: 'Small (320px)', value: 320 },
  { label: 'Medium (480px)', value: 480 },
  { label: 'Large (640px)', value: 640 },
  { label: 'Original', value: undefined as number | undefined },
];

export function OutputPanel({ fps, quality, resizeWidth, onChange }: OutputPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">Frame rate (FPS)</p>
        <div className="flex gap-2">
          {FPS_OPTIONS.map((f) => (
            <button
              key={f}
              onClick={() => onChange({ fps: f })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                fps === f ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">Output width</p>
        <div className="flex flex-wrap gap-2">
          {WIDTH_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => onChange({ resizeWidth: p.value })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                resizeWidth === p.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-gray-600">Quality</p>
        <div className="flex gap-2">
          {(['low', 'medium', 'high'] as const).map((q) => (
            <button
              key={q}
              onClick={() => onChange({ quality: q })}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                quality === q ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
