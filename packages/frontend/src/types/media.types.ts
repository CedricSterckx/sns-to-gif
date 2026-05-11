export type Platform = 'twitter' | 'instagram';

export interface MediaInfo {
  platform: Platform;
  videoUrl: string;    // proxied URL for <video> element
  directUrl: string;   // raw CDN URL for server-side FFmpeg download
  thumbnailUrl?: string;
  durationSeconds: number;
  originalWidth: number;
  originalHeight: number;
  authorHandle?: string;
}
