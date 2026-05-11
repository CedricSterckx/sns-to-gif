import 'dotenv/config';
import { execSync } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import { createApp } from './app.js';

// Use system FFmpeg if available (Railway installs it via nixpacks),
// otherwise fall back to the bundled static binary.
function resolveFFmpegPath(): string {
  try {
    return execSync('which ffmpeg', { encoding: 'utf8' }).trim();
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('ffmpeg-static') as string;
  }
}

function resolveFFprobePath(): string {
  try {
    return execSync('which ffprobe', { encoding: 'utf8' }).trim();
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return (require('ffprobe-static') as { path: string }).path;
  }
}

ffmpeg.setFfmpegPath(resolveFFmpegPath());
ffmpeg.setFfprobePath(resolveFFprobePath());

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const app = createApp();

app.listen(PORT, () => {
  console.log(`sns-to-gif backend listening on http://localhost:${PORT}`);
});
