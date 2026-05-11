export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface TextOverlay {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  startSec?: number;
  endSec?: number;
}

export interface GifOptions {
  videoUrl: string;
  trim: { startSec: number; endSec: number };
  speed: number;
  crop?: { x: number; y: number; width: number; height: number };
  resize?: { width: number };
  fps: number;
  quality: 'low' | 'medium' | 'high';
  textOverlays?: TextOverlay[];
}

export interface Job {
  id: string;
  status: JobStatus;
  options: GifOptions;
  progress: number;
  outputPath?: string;
  fileSizeBytes?: number;
  error?: string;
  createdAt: Date;
}
