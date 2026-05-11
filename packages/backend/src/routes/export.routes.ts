import { basename } from 'path';
import { getJob } from '../services/queue.service';
import { uploadToGiphy } from '../services/giphy.service';
import { AppError } from '../utils/errors';
import { json, CORS_HEADERS } from '../utils/response';

export async function serveGiphyExport(req: Request): Promise<Response> {
  let body: { jobId?: string; tags?: string[] };
  try {
    body = await req.json() as { jobId?: string; tags?: string[] };
  } catch {
    return json({ error: 'VALIDATION_ERROR', message: 'Invalid JSON body' }, 400);
  }

  const { jobId, tags = [] } = body;
  if (!jobId) {
    return json({ error: 'VALIDATION_ERROR', message: 'jobId is required' }, 400);
  }

  const job = getJob(jobId);
  if (!job) throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);
  if (job.status !== 'done' || !job.outputPath) {
    throw new AppError('JOB_NOT_READY', 'GIF is not ready yet', 409);
  }

  const result = await uploadToGiphy(job.outputPath, tags);
  return json(result);
}

export function serveDownload(jobId: string): Response {
  const job = getJob(jobId);
  if (!job) throw new AppError('JOB_NOT_FOUND', 'Job not found', 404);
  if (job.status !== 'done' || !job.outputPath) {
    throw new AppError('JOB_NOT_READY', 'GIF is not ready yet', 409);
  }

  const filename = basename(job.outputPath);
  return new Response(Bun.file(job.outputPath), {
    headers: {
      'Content-Disposition': `attachment; filename="sns-to-gif_${filename}"`,
      'Content-Type': 'image/gif',
      ...CORS_HEADERS,
    },
  });
}
