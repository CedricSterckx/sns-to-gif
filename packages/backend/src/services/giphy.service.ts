import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import { AppError } from '../utils/errors.js';

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
  form.append('file', fs.createReadStream(gifPath), { filename: 'animation.gif' });
  if (tags.length > 0) form.append('tags', tags.join(','));

  let response;
  try {
    response = await axios.post<{ data: { id: string } }>(
      'https://upload.giphy.com/v1/gifs',
      form,
      {
        headers: form.getHeaders(),
        timeout: 120000,
        maxBodyLength: 200 * 1024 * 1024,
      }
    );
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 429) throw new AppError('RATE_LIMITED', 'Giphy rate limit reached. Try again in a few minutes.', 429);
      if (status === 413) throw new AppError('FILE_TOO_LARGE', 'GIF is too large for Giphy (max ~100MB). Reduce quality or trim length.', 413);
    }
    throw new AppError('GIPHY_UPLOAD_FAILED', `Giphy upload failed: ${String(err)}`, 502);
  }

  const id = response.data.data.id;
  return {
    giphyId: id,
    giphyUrl: `https://media.giphy.com/media/${id}/giphy.gif`,
    embedUrl: `https://giphy.com/gifs/${id}`,
  };
}
