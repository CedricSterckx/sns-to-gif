import { useState } from 'react';
import { fetchMedia } from '../services/api';
import type { MediaInfo } from '../types/media.types';

export function useMediaFetch() {
  const [media, setMedia] = useState<MediaInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetch(url: string) {
    setLoading(true);
    setError(null);
    setMedia(null);
    try {
      const result = await fetchMedia(url);
      setMedia(result);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to fetch media. Check the URL and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return { media, loading, error, fetch };
}
