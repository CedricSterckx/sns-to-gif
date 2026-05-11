import axios from 'axios';
import * as cheerio from 'cheerio';
import { extractInstagramShortcode } from '../utils/url-parser.js';
import { NotFoundError, RateLimitError, UpstreamError } from '../utils/errors.js';
import type { MediaInfo } from '../types/media.types.js';

async function fetchViaDdInstagram(shortcode: string): Promise<string> {
  const url = `https://www.ddinstagram.com/p/${shortcode}/`;
  const res = await axios.get<string>(url, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
      Accept: 'text/html',
    },
  });

  const $ = cheerio.load(res.data);
  const videoUrl =
    $('meta[property="og:video"]').attr('content') ||
    $('meta[property="og:video:url"]').attr('content');

  if (!videoUrl) throw new NotFoundError('No video found via ddinstagram proxy');
  return videoUrl;
}

async function fetchViaEmbedEz(shortcode: string): Promise<string> {
  const apiKey = process.env.EMBEDEZ_API_KEY;
  if (!apiKey) throw new UpstreamError('No EmbedEz API key configured');

  const res = await axios.get<{ data?: { medias?: Array<{ url: string; type: string }> } }>(
    'https://embedez.com/api/v1/providers/combined',
    {
      params: { q: `https://www.instagram.com/p/${shortcode}/` },
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 15000,
    }
  );

  const medias = res.data?.data?.medias ?? [];
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
    // Fallback to EmbedEz if available
    try {
      videoUrl = await fetchViaEmbedEz(shortcode);
    } catch {
      if (axios.isAxiosError(primaryErr) && primaryErr.response?.status === 429) {
        throw new RateLimitError('Instagram rate limit — try again shortly');
      }
      throw new UpstreamError(
        `Could not fetch Instagram media. The post may be private or unavailable.`
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
