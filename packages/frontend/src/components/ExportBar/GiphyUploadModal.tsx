import { useState } from 'react';
import { uploadToGiphy } from '../../services/api';
import { Button } from '../shared/Button';
import { Spinner } from '../shared/Spinner';

interface GiphyUploadModalProps {
  jobId: string;
  onClose: () => void;
}

export function GiphyUploadModal({ jobId, onClose }: GiphyUploadModalProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ giphyUrl: string; embedUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function upload() {
    setLoading(true);
    setError(null);
    try {
      const res = await uploadToGiphy(jobId);
      setResult(res);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Upload failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function copyUrl() {
    if (result) {
      navigator.clipboard.writeText(result.giphyUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Upload to Giphy</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <p className="text-xs text-gray-400">
          Giphy uploads are <strong>public</strong> by default and visible to anyone with the link.
        </p>

        {!result && !loading && (
          <Button onClick={upload} className="w-full">
            Upload GIF to Giphy
          </Button>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">Uploading to Giphy…</p>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {result && (
          <div className="space-y-3">
            <img src={result.giphyUrl} alt="Uploaded GIF" className="w-full rounded-lg" />
            <div className="flex gap-2">
              <input
                readOnly
                value={result.giphyUrl}
                className="flex-1 rounded border border-gray-200 px-2 py-1 text-xs text-gray-600"
              />
              <Button variant="secondary" onClick={copyUrl}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <a
              href={result.embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-purple-600 py-2 text-center text-sm font-medium text-white hover:bg-purple-700"
            >
              Open on Giphy
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
