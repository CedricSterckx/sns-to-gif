import { Router, Request, Response, NextFunction } from 'express';
import { enqueueJob, getJob, getQueuePosition } from '../services/queue.service.js';
import { AppError } from '../utils/errors.js';
import type { GifOptions } from '../types/job.types.js';

const router = Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body as { videoUrl?: string; options?: Partial<GifOptions> };

    if (!body.videoUrl) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'videoUrl is required' });
    }
    if (!body.options) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'options is required' });
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
      return res.status(400).json({
        error: 'TRIM_TOO_LONG',
        message: 'Trim duration must be 60 seconds or less',
      });
    }
    if (trimDuration <= 0) {
      return res.status(400).json({
        error: 'INVALID_TRIM',
        message: 'End time must be after start time',
      });
    }

    const job = enqueueJob(opts);
    const queuePosition = getQueuePosition(job.id);

    return res.status(202).json({
      jobId: job.id,
      status: job.status,
      queuePosition,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = getJob(req.params.id);
    if (!job) {
      throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);
    }

    const queuePosition = job.status === 'queued' ? getQueuePosition(job.id) : undefined;
    const outputUrl = job.outputPath
      ? `/output/${req.params.id}.gif`
      : undefined;

    return res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      queuePosition,
      outputUrl,
      fileSizeBytes: job.fileSizeBytes,
      error: job.error,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
