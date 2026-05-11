import { useState, useEffect, useRef } from 'react';
import { useJobPoller } from '../../hooks/useJobPoller';
import { useGifExport } from '../../hooks/useGifExport';
import { GiphyUploadModal } from './GiphyUploadModal';
import { Button } from '../shared/Button';
import { formatFileSize } from '../../utils/formatTime';
import type { EditorState } from '../Editor/Editor';
import type { MediaInfo } from '../../types/media.types';

interface ExportBarProps {
  media: MediaInfo;
  editorState: EditorState;
}

export function ExportBar({ media, editorState }: ExportBarProps) {
  const { jobId, submitting, error: submitError, submitJob, resetJob } = useGifExport();
  const { data: job } = useJobPoller(jobId);
  const [showGiphy, setShowGiphy] = useState(false);
  const downloadedRef = useRef(false);

  // Auto-download when done
  useEffect(() => {
    if (job?.status === 'done' && job.outputUrl && !downloadedRef.current) {
      downloadedRef.current = true;
      const a = document.createElement('a');
      a.href = job.outputUrl;
      a.download = 'animation.gif';
      a.click();
    }
  }, [job]);

  // Reset download flag when starting a new job
  useEffect(() => {
    if (jobId) downloadedRef.current = false;
  }, [jobId]);

  function handleExport() {
    submitJob({
      videoUrl: media.directUrl,  // use raw CDN URL for server-side FFmpeg download
      trim: { startSec: editorState.trimStart, endSec: editorState.trimEnd },
      speed: editorState.speed,
      crop: editorState.crop ?? undefined,
      resize: editorState.resizeWidth ? { width: editorState.resizeWidth } : undefined,
      fps: editorState.fps,
      quality: editorState.quality,
      textOverlays: editorState.textOverlays.filter((o) => o.text.trim()),
    });
  }

  const isProcessing = job && (job.status === 'queued' || job.status === 'processing');
  const isDone = job?.status === 'done';
  const isFailed = job?.status === 'failed';
  const progress = job?.progress ?? 0;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">Export</h3>
        {isDone && job.fileSizeBytes && (
          <span className="text-xs text-gray-400">{formatFileSize(job.fileSizeBytes)}</span>
        )}
      </div>

      {(submitError || (isFailed && job?.error)) && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {submitError ?? job?.error}
        </div>
      )}

      {!isProcessing && !isDone && (
        <Button className="w-full" loading={submitting} onClick={handleExport}>
          Export GIF
        </Button>
      )}

      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{job.status === 'queued' ? `Queued (position ${job.queuePosition})` : 'Converting…'}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {isDone && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <a
              href={job.outputUrl}
              download="animation.gif"
              className="flex-1 rounded-lg bg-green-600 py-2 text-center text-sm font-medium text-white hover:bg-green-700"
            >
              Download GIF
            </a>
            <Button variant="secondary" onClick={() => setShowGiphy(true)}>
              Giphy
            </Button>
          </div>
          <button
            onClick={() => { resetJob(); downloadedRef.current = false; }}
            className="w-full text-center text-xs text-gray-400 hover:text-gray-600"
          >
            Start new export
          </button>
          {job.fileSizeBytes && job.fileSizeBytes > 25 * 1024 * 1024 && (
            <p className="text-xs text-amber-600">
              GIF is large ({formatFileSize(job.fileSizeBytes)}). Consider reducing quality or trim length.
            </p>
          )}
        </div>
      )}

      {isFailed && (
        <Button variant="secondary" className="w-full" onClick={resetJob}>
          Try again
        </Button>
      )}

      {showGiphy && jobId && (
        <GiphyUploadModal jobId={jobId} onClose={() => setShowGiphy(false)} />
      )}
    </div>
  );
}
