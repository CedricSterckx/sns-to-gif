import { useState, useRef } from 'react';
import { VideoPreview } from '../VideoPreview/VideoPreview';
import { TrimPanel } from './TrimPanel';
import { SpeedPanel } from './SpeedPanel';
import { CropPanel } from './CropPanel';
import { TextPanel } from './TextPanel';
import { OutputPanel } from './OutputPanel';
import type { TextOverlay } from '../../types/job.types';
import type { MediaInfo } from '../../types/media.types';

interface CropRect { x: number; y: number; width: number; height: number }

export interface EditorState {
  trimStart: number;
  trimEnd: number;
  speed: number;
  crop: CropRect | null;
  fps: number;
  quality: 'low' | 'medium' | 'high';
  resizeWidth: number | undefined;
  textOverlays: TextOverlay[];
}

interface EditorProps {
  media: MediaInfo;
  state: EditorState;
  onChange: (patch: Partial<EditorState>) => void;
}

type Panel = 'trim' | 'speed' | 'crop' | 'text' | 'output';

const PANELS: { id: Panel; label: string }[] = [
  { id: 'trim', label: 'Trim' },
  { id: 'speed', label: 'Speed' },
  { id: 'crop', label: 'Crop / Zoom' },
  { id: 'text', label: 'Text' },
  { id: 'output', label: 'Output' },
];

export function Editor({ media, state, onChange }: EditorProps) {
  const [activePanel, setActivePanel] = useState<Panel>('trim');
  const [duration, setDuration] = useState(media.durationSeconds || 0);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Preview */}
      <div className="flex-1 min-w-0">
        <VideoPreview
          src={media.videoUrl}
          speed={state.speed}
          crop={state.crop}
          trimStart={state.trimStart}
          trimEnd={state.trimEnd}
          textOverlays={state.textOverlays}
          videoRef={videoRef}
          onDurationChange={(d) => {
            setDuration(d);
            if (state.trimEnd === 0) onChange({ trimEnd: Math.min(d, 10) });
          }}
          onTimeUpdate={() => {}}
        />
        <p className="mt-1 text-center text-xs text-gray-400">
          Live preview — fast, no encoding
        </p>
      </div>

      {/* Controls */}
      <div className="w-full lg:w-80 flex flex-col gap-3">
        {/* Panel tabs */}
        <div className="flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
          {PANELS.map((p) => (
            <button
              key={p.id}
              onClick={() => setActivePanel(p.id)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                activePanel === p.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Active panel content */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          {activePanel === 'trim' && (
            <TrimPanel
              duration={duration}
              startSec={state.trimStart}
              endSec={state.trimEnd}
              onChange={(start, end) => onChange({ trimStart: start, trimEnd: end })}
              onSeek={(t) => { if (videoRef.current) videoRef.current.currentTime = t; }}
            />
          )}
          {activePanel === 'speed' && (
            <SpeedPanel speed={state.speed} onChange={(s) => onChange({ speed: s })} />
          )}
          {activePanel === 'crop' && (
            <CropPanel
              videoWidth={media.originalWidth || 1280}
              videoHeight={media.originalHeight || 720}
              crop={state.crop}
              onChange={(c) => onChange({ crop: c })}
            />
          )}
          {activePanel === 'text' && (
            <TextPanel
              overlays={state.textOverlays}
              trimStart={state.trimStart}
              trimEnd={state.trimEnd}
              onChange={(overlays) => onChange({ textOverlays: overlays })}
            />
          )}
          {activePanel === 'output' && (
            <OutputPanel
              fps={state.fps}
              quality={state.quality}
              resizeWidth={state.resizeWidth}
              onChange={(patch) => onChange(patch)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
