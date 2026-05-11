const SPEEDS = [0.25, 0.5, 1, 1.5, 2, 4];

interface SpeedPanelProps {
  speed: number;
  onChange: (speed: number) => void;
}

export function SpeedPanel({ speed, onChange }: SpeedPanelProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SPEEDS.map((s) => (
        <button
          key={s}
          onClick={() => onChange(s)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            speed === s
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {s}x
        </button>
      ))}
    </div>
  );
}
