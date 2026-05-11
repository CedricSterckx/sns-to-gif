import { Range, getTrackBackground } from 'react-range';
import { formatTime } from '../../utils/formatTime';

interface TrimPanelProps {
  duration: number;
  startSec: number;
  endSec: number;
  onChange: (start: number, end: number) => void;
  onSeek: (time: number) => void;
}

export function TrimPanel({ duration, startSec, endSec, onChange, onSeek }: TrimPanelProps) {
  const max = duration > 0 ? duration : 60;
  // Clamp values to [0, max] to prevent react-range from throwing when the
  // default trimEnd (10s) exceeds a short video's actual duration.
  const clampedStart = Math.min(startSec, max);
  const clampedEnd = Math.min(endSec, max);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Start: <span className="font-mono font-medium text-gray-800">{formatTime(clampedStart)}</span></span>
        <span className="font-medium text-orange-600">
          {(clampedEnd - clampedStart).toFixed(1)}s selected
          {clampedEnd - clampedStart > 20 && (
            <span className="ml-2 text-amber-500">(large GIF — consider reducing)</span>
          )}
        </span>
        <span>End: <span className="font-mono font-medium text-gray-800">{formatTime(clampedEnd)}</span></span>
      </div>
      <Range
        step={0.1}
        min={0}
        max={max}
        values={[clampedStart, clampedEnd]}
        onChange={(values) => {
          onChange(values[0], values[1]);
          onSeek(values[0]);
        }}
        renderTrack={({ props, children }) => (
          <div
            {...props}
            className="h-3 w-full rounded-full"
            style={{
              ...props.style,
              background: getTrackBackground({
                values: [clampedStart, clampedEnd],
                colors: ['#e5e7eb', '#6366f1', '#e5e7eb'],
                min: 0,
                max,
              }),
            }}
          >
            {children}
          </div>
        )}
        renderThumb={({ props, index }) => (
          <div
            {...props}
            key={index}
            className="h-5 w-5 rounded-full border-2 border-indigo-600 bg-white shadow focus:outline-none focus:ring-2 focus:ring-indigo-400"
            style={props.style}
          />
        )}
      />
    </div>
  );
}
