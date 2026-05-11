import ffmpegStaticPath from 'ffmpeg-static';
import { setFfmpegBin } from './services/ffmpeg.service';
import { createRequestHandler } from './app';

function resolveFFmpegPath(): string {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  try {
    const result = Bun.spawnSync([cmd, 'ffmpeg']);
    if (result.exitCode === 0) {
      const p = new TextDecoder().decode(result.stdout).trim().split('\n')[0].trim();
      if (p) return p;
    }
  } catch { /* not found on PATH */ }
  if (!ffmpegStaticPath) throw new Error('No FFmpeg binary found on PATH or via ffmpeg-static');
  return ffmpegStaticPath;
}

setFfmpegBin(resolveFFmpegPath());

const PORT = parseInt(process.env.PORT ?? '3001', 10);

Bun.serve({
  port: PORT,
  fetch: createRequestHandler(),
});

console.log(`sns-to-gif backend listening on http://localhost:${PORT}`);
