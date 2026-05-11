import 'dotenv/config';
import { execSync } from 'child_process';
import { createApp } from './app.js';
import { setFfmpegBin } from './services/ffmpeg.service.js';

// Use system FFmpeg if available (e.g. installed via Railway nixpacks),
// otherwise fall back to the bundled ffmpeg-static binary.
function resolveFFmpegPath(): string {
  try {
    const p = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
    if (p) return p;
  } catch { /* not found on PATH */ }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('ffmpeg-static') as string;
}

setFfmpegBin(resolveFFmpegPath());

const PORT = parseInt(process.env.PORT ?? '3001', 10);
const app = createApp();

app.listen(PORT, () => {
  console.log(`sns-to-gif backend listening on http://localhost:${PORT}`);
});
