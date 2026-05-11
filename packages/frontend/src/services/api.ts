import axios from 'axios';
import type { MediaInfo } from '../types/media.types';
import type { GifOptions, JobResponse } from '../types/job.types';

const client = axios.create({ baseURL: '/api' });

export async function fetchMedia(url: string): Promise<MediaInfo> {
  const res = await client.post<MediaInfo>('/media/fetch', { url });
  return res.data;
}

export async function createJob(
  videoUrl: string,
  options: Omit<GifOptions, 'videoUrl'>
): Promise<{ jobId: string; status: string; queuePosition: number }> {
  const res = await client.post('/jobs', { videoUrl, options });
  return res.data;
}

export async function getJobStatus(jobId: string): Promise<JobResponse> {
  const res = await client.get<JobResponse>(`/jobs/${jobId}`);
  return res.data;
}

export async function uploadToGiphy(
  jobId: string,
  tags: string[] = []
): Promise<{ giphyId: string; giphyUrl: string; embedUrl: string }> {
  const res = await client.post('/export/giphy', { jobId, tags });
  return res.data;
}
