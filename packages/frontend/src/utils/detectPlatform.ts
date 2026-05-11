export type Platform = 'twitter' | 'instagram' | null;

export function detectPlatform(url: string): Platform {
  if (/(?:twitter|x|fxtwitter)\.com/.test(url)) return 'twitter';
  if (/instagram\.com/.test(url)) return 'instagram';
  return null;
}
