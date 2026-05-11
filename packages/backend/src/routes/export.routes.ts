import { Router, Request, Response, NextFunction } from 'express';
import path from 'path';
import { getJob } from '../services/queue.service.js';
import { uploadToGiphy } from '../services/giphy.service.js';
import { AppError } from '../utils/errors.js';

const router = Router();

router.post('/giphy', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { jobId, tags = [] } = req.body as { jobId?: string; tags?: string[] };

    if (!jobId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'jobId is required' });
    }

    const job = getJob(jobId);
    if (!job) throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);
    if (job.status !== 'done' || !job.outputPath) {
      throw new AppError('JOB_NOT_READY', 'GIF is not ready yet', 409);
    }

    const result = await uploadToGiphy(job.outputPath, tags);
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/download/:jobId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = getJob(req.params.jobId);
    if (!job) throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);
    if (job.status !== 'done' || !job.outputPath) {
      throw new AppError('JOB_NOT_READY', 'GIF is not ready yet', 409);
    }

    const filename = path.basename(job.outputPath);
    res.download(job.outputPath, `sns-to-gif_${filename}`);
  } catch (err) {
    next(err);
  }
});

export default router;
