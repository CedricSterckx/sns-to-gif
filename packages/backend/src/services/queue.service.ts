import { downloadToTemp } from './downloader.service';
import { convertToGif } from './ffmpeg.service';
import { cleanupFile } from '../utils/temp';
import type { Job, GifOptions } from '../types/job.types';

const jobs = new Map<string, Job>();
let activeJobs = 0;
const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_JOBS ?? '2', 10);

export function enqueueJob(options: GifOptions): Job {
  const job: Job = {
    id: crypto.randomUUID(),
    status: 'queued',
    options,
    progress: 0,
    createdAt: new Date(),
  };
  jobs.set(job.id, job);
  processNext();
  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

export function getQueuePosition(id: string): number {
  const queued = [...jobs.values()].filter((j) => j.status === 'queued');
  const idx = queued.findIndex((j) => j.id === id);
  return idx + 1;
}

function updateJob(id: string, patch: Partial<Job>): void {
  const job = jobs.get(id);
  if (job) jobs.set(id, { ...job, ...patch });
}

function processNext(): void {
  if (activeJobs >= MAX_CONCURRENT) return;

  const next = [...jobs.values()].find((j) => j.status === 'queued');
  if (!next) return;

  activeJobs++;
  updateJob(next.id, { status: 'processing' });
  runJob(next).finally(() => {
    activeJobs--;
    processNext();
  });
}

async function runJob(job: Job): Promise<void> {
  let inputPath: string | undefined;

  try {
    updateJob(job.id, { progress: 5 });
    inputPath = await downloadToTemp(job.options.videoUrl, job.id);

    updateJob(job.id, { progress: 20 });
    const { outputPath, fileSizeBytes } = await convertToGif(
      inputPath,
      job.id,
      job.options,
      (pct) => updateJob(job.id, { progress: 20 + Math.round(pct * 0.8) })
    );

    updateJob(job.id, { status: 'done', progress: 100, outputPath, fileSizeBytes });
  } catch (err) {
    updateJob(job.id, {
      status: 'failed',
      error: err instanceof Error ? err.message : String(err),
    });
  } finally {
    if (inputPath) cleanupFile(inputPath);
  }
}

const expiryHours = parseInt(process.env.GIF_EXPIRY_HOURS ?? '1', 10);
setInterval(() => {
  const cutoff = Date.now() - expiryHours * 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.createdAt.getTime() < cutoff) {
      if (job.outputPath) cleanupFile(job.outputPath);
      jobs.delete(id);
    }
  }
}, 15 * 60 * 1000);
