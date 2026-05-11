import fs from 'fs';
import path from 'path';
import { getTempDir, getOutputDir, cleanupFile } from '../utils/temp';
import type { GifOptions, TextOverlay } from '../types/job.types';

let ffmpegBin = 'ffmpeg';

export function setFfmpegBin(p: string) {
  ffmpegBin = p;
}

function speedToPts(speed: number): string {
  return (1 / speed).toFixed(6);
}

function buildDrawtextFilter(overlay: TextOverlay, outWidth: number): string {
  const outHeight = Math.round((outWidth * 9) / 16);
  const x = Math.round((overlay.x / 100) * outWidth);
  const y = Math.round((overlay.y / 100) * outHeight);
  const color = overlay.color.replace('#', '');
  const text = overlay.text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:');

  const timeFilter =
    overlay.startSec !== undefined && overlay.endSec !== undefined
      ? `:enable='between(t,${overlay.startSec},${overlay.endSec})'`
      : '';

  return (
    `drawtext=text='${text}'` +
    `:fontcolor=0x${color}` +
    `:fontsize=${overlay.fontSize}` +
    `:x=${x}:y=${y}` +
    `:box=1:boxcolor=black@0.5:boxborderw=4` +
    timeFilter
  );
}

function buildBaseFilters(opts: GifOptions, withText: boolean): string[] {
  const filters: string[] = [];
  const outWidth = opts.resize?.width ?? 480;

  if (opts.crop) {
    const { x, y, width, height } = opts.crop;
    filters.push(`crop=${width}:${height}:${x}:${y}`);
  }

  filters.push(`fps=${opts.fps}`);

  const pts = speedToPts(opts.speed);
  if (opts.speed !== 1) filters.push(`setpts=${pts}*PTS`);

  filters.push(`scale=${outWidth}:-2:flags=lanczos`);

  if (withText && opts.textOverlays?.length) {
    for (const overlay of opts.textOverlays) {
      if (overlay.text.trim()) filters.push(buildDrawtextFilter(overlay, outWidth));
    }
  }

  return filters;
}

async function runFfmpeg(
  args: string[],
  trimDuration: number,
  onProgress?: (pct: number) => void
): Promise<void> {
  const proc = Bun.spawn([ffmpegBin, ...args], {
    stdin: 'ignore',
    stdout: 'ignore',
    stderr: 'pipe',
  });

  const decoder = new TextDecoder();
  let stderr = '';

  const reader = proc.stderr.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    stderr += text;

    if (onProgress && trimDuration > 0) {
      const m = text.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d+)/);
      if (m) {
        const elapsed = parseInt(m[1]) * 3600 + parseInt(m[2]) * 60 + parseFloat(m[3]);
        onProgress(Math.min(99, (elapsed / trimDuration) * 100));
      }
    }
  }

  const code = await proc.exited;
  if (code !== 0) {
    throw new Error(`ffmpeg exited with code ${code}:\n${stderr.slice(-2000)}`);
  }
}

export async function convertToGif(
  inputPath: string,
  jobId: string,
  opts: GifOptions,
  onProgress: (pct: number) => void
): Promise<{ outputPath: string; fileSizeBytes: number }> {
  const tempDir = getTempDir();
  const outputDir = getOutputDir();
  const palettePath = path.join(tempDir, `palette_${jobId}.png`);
  const outputPath = path.join(outputDir, `${jobId}.gif`);

  const ss = String(opts.trim.startSec);
  const to = String(opts.trim.endSec);
  const trimDuration = opts.trim.endSec - opts.trim.startSec;

  const qualityMap = {
    low: { colors: 64, dither: 'none', bayerScale: 0 },
    medium: { colors: 128, dither: 'bayer', bayerScale: 3 },
    high: { colors: 256, dither: 'bayer', bayerScale: 5 },
  };
  const q = qualityMap[opts.quality];

  const pass1Vf = [
    ...buildBaseFilters(opts, false),
    `palettegen=max_colors=${q.colors}:stats_mode=diff`,
  ].join(',');

  await runFfmpeg(
    ['-ss', ss, '-to', to, '-i', inputPath, '-vf', pass1Vf, '-vframes', '1', '-y', palettePath],
    trimDuration
  );

  onProgress(40);

  const baseFilters = buildBaseFilters(opts, true);
  const paletteuse =
    q.dither === 'none'
      ? 'paletteuse=dither=none'
      : `paletteuse=dither=${q.dither}:bayer_scale=${q.bayerScale}${
          opts.quality === 'high' ? ':diff_mode=rectangle' : ''
        }`;

  const filterComplex = `${baseFilters.join(',')} [x]; [x][1:v] ${paletteuse}`;

  await runFfmpeg(
    [
      '-ss', ss,
      '-to', to,
      '-i', inputPath,
      '-i', palettePath,
      '-filter_complex', filterComplex,
      '-an',
      '-y', outputPath,
    ],
    trimDuration,
    (pct) => onProgress(40 + Math.round(pct * 0.6))
  );

  cleanupFile(palettePath);

  const { size } = fs.statSync(outputPath);
  onProgress(100);

  return { outputPath, fileSizeBytes: size };
}
