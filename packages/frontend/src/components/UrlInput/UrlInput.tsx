import { useState, ClipboardEvent } from 'react';
import { detectPlatform } from '../../utils/detectPlatform';
import { Button } from '../shared/Button';

interface UrlInputProps {
  onFetch: (url: string) => void;
  loading: boolean;
}

export function UrlInput({ onFetch, loading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const platform = detectPlatform(url);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (url.trim()) onFetch(url.trim());
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text');
    const detected = detectPlatform(pasted);
    if (detected) {
      setTimeout(() => onFetch(pasted.trim()), 50);
    }
  }

  const platformBadge =
    platform === 'twitter'
      ? { label: 'X / Twitter', color: 'bg-sky-100 text-sky-700' }
      : platform === 'instagram'
      ? { label: 'Instagram', color: 'bg-pink-100 text-pink-700' }
      : null;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700">
        Paste a Twitter/X or Instagram URL
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onPaste={handlePaste}
            placeholder="https://x.com/user/status/... or https://www.instagram.com/p/..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-28 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {platformBadge && (
            <span className={`absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-0.5 text-xs font-medium ${platformBadge.color}`}>
              {platformBadge.label}
            </span>
          )}
        </div>
        <Button type="submit" loading={loading} disabled={!url.trim()}>
          Fetch
        </Button>
      </div>
      <p className="text-xs text-gray-400">
        Supported: x.com · twitter.com · fxtwitter.com · instagram.com/p/ · instagram.com/reel/
      </p>
    </form>
  );
}
