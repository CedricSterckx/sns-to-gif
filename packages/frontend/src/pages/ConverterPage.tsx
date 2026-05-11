import { useState } from 'react';
import { UrlInput } from '../components/UrlInput/UrlInput';
import { Editor, EditorState } from '../components/Editor/Editor';
import { ExportBar } from '../components/ExportBar/ExportBar';
import { ErrorBanner } from '../components/shared/ErrorBanner';
import { Spinner } from '../components/shared/Spinner';
import { useMediaFetch } from '../hooks/useMediaFetch';

const defaultEditorState: EditorState = {
  trimStart: 0,
  trimEnd: 10,
  speed: 1,
  crop: null,
  fps: 12,
  quality: 'medium',
  resizeWidth: 480,
  textOverlays: [],
};

export function ConverterPage() {
  const { media, loading, error, fetch } = useMediaFetch();
  const [editorState, setEditorState] = useState<EditorState>(defaultEditorState);

  function handleFetch(url: string) {
    setEditorState(defaultEditorState);
    fetch(url);
  }

  function patchEditor(patch: Partial<EditorState>) {
    setEditorState((prev) => ({ ...prev, ...patch }));
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-sm">
            G
          </div>
          <h1 className="text-lg font-semibold text-gray-900">sns-to-gif</h1>
          <span className="text-xs text-gray-400">Twitter/X + Instagram → GIF</span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 p-4">
        {/* URL Input */}
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <UrlInput onFetch={handleFetch} loading={loading} />
        </div>

        {/* Error */}
        {error && <ErrorBanner message={error} />}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-3 py-12 text-gray-400">
            <Spinner />
            <span className="text-sm">Fetching media…</span>
          </div>
        )}

        {/* Editor + Export */}
        {media && !loading && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize">
                {media.platform}
              </span>
              {media.authorHandle && <span>@{media.authorHandle}</span>}
              {media.durationSeconds > 0 && (
                <span className="text-gray-400">• {media.durationSeconds.toFixed(1)}s</span>
              )}
            </div>
            <Editor media={media} state={editorState} onChange={patchEditor} />
            <ExportBar media={media} editorState={editorState} />
          </div>
        )}

        {/* Empty state */}
        {!media && !loading && !error && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="text-5xl">🎬</div>
            <div>
              <p className="font-medium text-gray-700">Paste a Twitter/X or Instagram link to get started</p>
              <p className="mt-1 text-sm text-gray-400">
                Trim, speed up, add captions, and export as GIF
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
