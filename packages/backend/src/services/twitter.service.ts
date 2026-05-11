import axios from 'axios';
import { extractTweetId } from '../utils/url-parser.js';
import { NotFoundError, RateLimitError, UpstreamError } from '../utils/errors.js';
import type { MediaInfo } from '../types/media.types.js';

interface FxTwitterVariant {
  content_type: string;
  bitrate?: number;
  url: string;
}

interface FxTwitterMedia {
  type: string;
  url: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  variants?: FxTwitterVariant[];
}

interface FxTwitterResponse {
  code: number;
  message: string;
  tweet?: {
    author?: { screen_name: string };
    media?: {
      all?: FxTwitterMedia[];
    };
  };
}

export async function fetchTwitterMedia(rawUrl: string): Promise<MediaInfo> {
  const tweetId = extractTweetId(rawUrl);

  let response;
  try {
    response = await axios.get<FxTwitterResponse>(
      `https://api.fxtwitter.com/u/status/${tweetId}`,
      {
        timeout: 15000,
        headers: { 'User-Agent': 'sns-to-gif/1.0' },
      }
    );
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 429) throw new RateLimitError('Twitter rate limit hit');
      if (err.response?.status === 404) throw new NotFoundError('Tweet not found');
    }
    throw new UpstreamError(`fxtwitter request failed: ${String(err)}`);
  }

  const data = response.data;
  if (!data.tweet) throw new NotFoundError('Tweet not found or has no media');

  const allMedia = data.tweet.media?.all ?? [];
  const videoMedia = allMedia.find((m) => m.type === 'video' || m.type === 'gif');
  if (!videoMedia) throw new NotFoundError('No video or GIF found in this tweet');

  let videoUrl = videoMedia.url;

  // Pick the highest-bitrate MP4 variant if available
  if (videoMedia.variants && videoMedia.variants.length > 0) {
    const mp4Variants = videoMedia.variants.filter(
      (v) => v.content_type === 'video/mp4' && v.url
    );
    if (mp4Variants.length > 0) {
      mp4Variants.sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
      videoUrl = mp4Variants[0].url;
    }
  }

  return {
    platform: 'twitter',
    videoUrl,
    thumbnailUrl: videoMedia.thumbnail_url,
    durationSeconds: videoMedia.duration ?? 0,
    originalWidth: videoMedia.width ?? 0,
    originalHeight: videoMedia.height ?? 0,
    authorHandle: data.tweet.author?.screen_name,
  };
}
