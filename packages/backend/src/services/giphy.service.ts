import { AppError } from '../utils/errors';

export interface GiphyUploadResult {
  giphyId: string;
  giphyUrl: string;
  embedUrl: string;
}

export async function uploadToGiphy(gifPath: string, tags: string[]): Promise<GiphyUploadResult> {
  const apiKey = process.env.GIPHY_API_KEY;
  if (!apiKey) {
    throw new AppError(
      'GIPHY_NOT_CONFIGURED',
      'GIPHY_API_KEY is not set. Add it to packages/backend/.env to enable Giphy uploads.',
      503
    );
  }

  const form = new FormData();
  form.append('api_key', apiKey);
  form.append('file', Bun.file(gifPath), 'animation.gif');
  if (tags.length > 0) form.append('tags', tags.join(','));

  let res: Response;
  try {
    res = await fetch('https://upload.giphy.com/v1/gifs', {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(120000),
    });
  } catch (err) {
    throw new AppError('GIPHY_UPLOAD_FAILED', `Giphy upload failed: ${String(err)}`, 502);
  }

  if (res.status === 429) throw new AppError('RATE_LIMITED', 'Giphy rate limit reached. Try again in a few minutes.', 429);
  if (res.status === 413) throw new AppError('FILE_TOO_LARGE', 'GIF is too large for Giphy (max ~100MB). Reduce quality or trim length.', 413);
  if (!res.ok) throw new AppError('GIPHY_UPLOAD_FAILED', `Giphy upload failed: HTTP ${res.status}`, 502);

  const data = await res.json() as { data: { id: string } };
  const id = data.data.id;
  return {
    giphyId: id,
    giphyUrl: `https://media.giphy.com/media/${id}/giphy.gif`,
    embedUrl: `https://giphy.com/gifs/${id}`,
  };
}
