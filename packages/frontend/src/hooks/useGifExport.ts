import { useState } from 'react';
import { createJob } from '../services/api';
import type { GifOptions } from '../types/job.types';

export function useGifExport() {
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitJob(options: GifOptions) {
    setSubmitting(true);
    setError(null);
    try {
      const { videoUrl, ...rest } = options;
      const result = await createJob(videoUrl, rest);
      setJobId(result.jobId);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to start conversion job.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function resetJob() {
    setJobId(null);
    setError(null);
  }

  return { jobId, submitting, error, submitJob, resetJob };
}
