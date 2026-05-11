import { detectPlatform } from '../utils/url-parser';
import { fetchTwitterMedia } from '../services/twitter.service';
import { fetchInstagramMedia } from '../services/instagram.service';
import { InvalidUrlError } from '../utils/errors';
import { json } from '../utils/response';

export async function serveMediaFetch(req: Request): Promise<Response> {
  let body: { url?: string };
  try {
    body = await req.json() as { url?: string };
  } catch {
    return json({ error: 'INVALID_URL', message: 'url is required' }, 400);
  }

  const url = body?.url;
  if (!url || typeof url !== 'string') {
    return json({ error: 'INVALID_URL', message: 'url is required' }, 400);
  }

  const platform = detectPlatform(url.trim());
  if (!platform) {
    throw new InvalidUrlError('URL must be from Twitter/X or Instagram');
  }

  const media =
    platform === 'twitter'
      ? await fetchTwitterMedia(url.trim())
      : await fetchInstagramMedia(url.trim());

  return json({
    ...media,
    directUrl: media.videoUrl,
    videoUrl: `/api/proxy?url=${encodeURIComponent(media.videoUrl)}`,
  });
}
