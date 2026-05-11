import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { getTempDir } from '../utils/temp.js';
import { UpstreamError } from '../utils/errors.js';

export async function downloadToTemp(videoUrl: string, jobId: string): Promise<string> {
  const tempDir = getTempDir();
  const destPath = path.join(tempDir, `${jobId}_input.mp4`);

  let response;
  try {
    response = await axios.get<NodeJS.ReadableStream>(videoUrl, {
      responseType: 'stream',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; sns-to-gif/1.0)',
      },
    });
  } catch (err) {
    throw new UpstreamError(`Failed to download video: ${String(err)}`);
  }

  await new Promise<void>((resolve, reject) => {
    const writer = fs.createWriteStream(destPath);
    (response.data as NodeJS.ReadableStream).pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  return destPath;
}
