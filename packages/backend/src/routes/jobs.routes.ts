import { enqueueJob, getJob, getQueuePosition } from '../services/queue.service';
import { AppError } from '../utils/errors';
import { json } from '../utils/response';
import type { GifOptions } from '../types/job.types';

export async function serveCreateJob(req: Request): Promise<Response> {
  let body: { videoUrl?: string; options?: Partial<GifOptions> };
  try {
    body = await req.json() as { videoUrl?: string; options?: Partial<GifOptions> };
  } catch {
    return json({ error: 'VALIDATION_ERROR', message: 'Invalid JSON body' }, 400);
  }

  if (!body.videoUrl) {
    return json({ error: 'VALIDATION_ERROR', message: 'videoUrl is required' }, 400);
  }
  if (!body.options) {
    return json({ error: 'VALIDATION_ERROR', message: 'options is required' }, 400);
  }

  const opts: GifOptions = {
    videoUrl: body.videoUrl,
    trim: body.options.trim ?? { startSec: 0, endSec: 10 },
    speed: body.options.speed ?? 1,
    fps: body.options.fps ?? 12,
    quality: body.options.quality ?? 'medium',
    crop: body.options.crop,
    resize: body.options.resize,
    textOverlays: body.options.textOverlays,
  };

  const trimDuration = opts.trim.endSec - opts.trim.startSec;
  if (trimDuration > 60) {
    return json({ error: 'TRIM_TOO_LONG', message: 'Trim duration must be 60 seconds or less' }, 400);
  }
  if (trimDuration <= 0) {
    return json({ error: 'INVALID_TRIM', message: 'End time must be after start time' }, 400);
  }

  const job = enqueueJob(opts);
  const queuePosition = getQueuePosition(job.id);

  return json({ jobId: job.id, status: job.status, queuePosition }, 202);
}

export function serveGetJob(id: string): Response {
  const job = getJob(id);
  if (!job) throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);

  const queuePosition = job.status === 'queued' ? getQueuePosition(job.id) : undefined;
  const outputUrl = job.outputPath ? `/output/${id}.gif` : undefined;

  return json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    queuePosition,
    outputUrl,
    fileSizeBytes: job.fileSizeBytes,
    error: job.error,
  });
}
