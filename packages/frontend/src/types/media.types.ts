export type Platform = 'twitter' | 'instagram';

export interface MediaInfo {
  platform: Platform;
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  originalWidth: number;
  originalHeight: number;
  authorHandle?: string;
}
