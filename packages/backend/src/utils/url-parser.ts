import { InvalidUrlError } from './errors.js';

export function extractTweetId(rawUrl: string): string {
  const match = rawUrl.match(/(?:twitter|x|fxtwitter)\.com\/\w+\/status\/(\d+)/);
  if (!match) throw new InvalidUrlError(`Could not extract tweet ID from URL: ${rawUrl}`);
  return match[1];
}

export function extractInstagramShortcode(rawUrl: string): string {
  const match = rawUrl.match(/instagram\.com\/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (!match) throw new InvalidUrlError(`Could not extract Instagram shortcode from URL: ${rawUrl}`);
  return match[1];
}

export type DetectedPlatform = 'twitter' | 'instagram' | null;

export function detectPlatform(url: string): DetectedPlatform {
  if (/(?:twitter|x|fxtwitter)\.com/.test(url)) return 'twitter';
  if (/instagram\.com/.test(url)) return 'instagram';
  return null;
}
