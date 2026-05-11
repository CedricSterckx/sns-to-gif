import { join } from 'path';
import { getTempDir } from '../utils/temp';
import { UpstreamError } from '../utils/errors';

export async function downloadToTemp(videoUrl: string, jobId: string): Promise<string> {
  const destPath = join(getTempDir(), `${jobId}_input.mp4`);

  let res: Response;
  try {
    res = await fetch(videoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; sns-to-gif/1.0)' },
      signal: AbortSignal.timeout(60000),
    });
  } catch (err) {
    throw new UpstreamError(`Failed to download video: ${String(err)}`);
  }

  if (!res.ok) {
    throw new UpstreamError(`Failed to download video: HTTP ${res.status}`);
  }

  await Bun.write(destPath, res);
  return destPath;
}
