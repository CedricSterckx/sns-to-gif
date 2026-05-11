import * as cheerio from 'cheerio';
import { extractInstagramShortcode } from '../utils/url-parser';
import { NotFoundError, RateLimitError, UpstreamError } from '../utils/errors';
import type { MediaInfo } from '../types/media.types';

async function fetchViaDdInstagram(shortcode: string): Promise<string> {
  const res = await fetch(`https://www.ddinstagram.com/p/${shortcode}/`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
      Accept: 'text/html',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (res.status === 429) throw new RateLimitError('Instagram rate limit — try again shortly');
  if (!res.ok) throw new NotFoundError('No video found via ddinstagram proxy');

  const $ = cheerio.load(await res.text());
  const videoUrl =
    $('meta[property="og:video"]').attr('content') ||
    $('meta[property="og:video:url"]').attr('content');

  if (!videoUrl) throw new NotFoundError('No video found via ddinstagram proxy');
  return videoUrl;
}

async function fetchViaEmbedEz(shortcode: string): Promise<string> {
  const apiKey = process.env.EMBEDEZ_API_KEY;
  if (!apiKey) throw new UpstreamError('No EmbedEz API key configured');

  const url = new URL('https://embedez.com/api/v1/providers/combined');
  url.searchParams.set('q', `https://www.instagram.com/p/${shortcode}/`);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new UpstreamError(`EmbedEz API error: HTTP ${res.status}`);

  const data = await res.json() as { data?: { medias?: Array<{ url: string; type: string }> } };
  const medias = data?.data?.medias ?? [];
  const video = medias.find((m) => m.type === 'video');
  if (!video?.url) throw new NotFoundError('No video returned by EmbedEz');
  return video.url;
}

export async function fetchInstagramMedia(rawUrl: string): Promise<MediaInfo> {
  const shortcode = extractInstagramShortcode(rawUrl);

  let videoUrl: string;

  try {
    videoUrl = await fetchViaDdInstagram(shortcode);
  } catch (primaryErr) {
    if (primaryErr instanceof RateLimitError) throw primaryErr;
    try {
      videoUrl = await fetchViaEmbedEz(shortcode);
    } catch {
      throw new UpstreamError(
        'Could not fetch Instagram media. The post may be private or unavailable.'
      );
    }
  }

  return {
    platform: 'instagram',
    videoUrl,
    durationSeconds: 0,
    originalWidth: 0,
    originalHeight: 0,
  };
}
