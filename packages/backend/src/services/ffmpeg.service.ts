import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { getTempDir, getOutputDir, cleanupFile } from '../utils/temp.js';
import type { GifOptions, TextOverlay } from '../types/job.types.js';

function speedToPts(speed: number): number {
  return 1 / speed;
}

function buildDrawtextFilter(overlay: TextOverlay, outputWidth: number, outputHeight: number): string {
  const x = Math.round((overlay.x / 100) * outputWidth);
  const y = Math.round((overlay.y / 100) * outputHeight);
  const color = overlay.color.replace('#', '');
  const timeFilter =
    overlay.startSec !== undefined && overlay.endSec !== undefined
      ? `:enable='between(t,${overlay.startSec},${overlay.endSec})'`
      : '';
  const escapedText = overlay.text.replace(/'/g, "\\'").replace(/:/g, '\\:');

  return (
    `drawtext=text='${escapedText}'` +
    `:fontcolor=${color}` +
    `:fontsize=${overlay.fontSize}` +
    `:x=${x}:y=${y}` +
    `:box=1:boxcolor=black@0.5:boxborderw=4` +
    timeFilter
  );
}

function buildVfChain(opts: GifOptions, palettePass: boolean): string {
  const filters: string[] = [];

  if (opts.crop) {
    const { x, y, width, height } = opts.crop;
    filters.push(`crop=${width}:${height}:${x}:${y}`);
  }

  filters.push(`fps=${opts.fps}`);

  const pts = speedToPts(opts.speed);
  if (pts !== 1) filters.push(`setpts=${pts}*PTS`);

  const outWidth = opts.resize?.width ?? 480;
  filters.push(`scale=${outWidth}:-1:flags=lanczos`);

  const qualityMap = {
    low: { colors: 64 },
    medium: { colors: 128 },
    high: { colors: 256 },
  };
  const { colors } = qualityMap[opts.quality];

  if (palettePass) {
    filters.push(`palettegen=max_colors=${colors}:stats_mode=diff`);
  } else {
    if (opts.textOverlays && opts.textOverlays.length > 0) {
      for (const overlay of opts.textOverlays) {
        filters.push(buildDrawtextFilter(overlay, outWidth, Math.round((outWidth * 9) / 16)));
      }
    }
  }

  return filters.join(',');
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

  const ss = opts.trim.startSec;
  const to = opts.trim.endSec;
  const vf1 = buildVfChain(opts, true);

  // Pass 1: generate palette
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(ss)
      .inputOption(`-to ${to}`)
      .outputOptions([`-vf ${vf1}`, '-vframes 1'])
      .save(palettePath)
      .on('end', () => resolve())
      .on('error', (e: Error) => reject(e));
  });

  onProgress(40);

  // Build pass-2 filtergraph with palette
  const baseFilters: string[] = [];

  if (opts.crop) {
    const { x, y, width, height } = opts.crop;
    baseFilters.push(`crop=${width}:${height}:${x}:${y}`);
  }
  baseFilters.push(`fps=${opts.fps}`);
  const pts = speedToPts(opts.speed);
  if (pts !== 1) baseFilters.push(`setpts=${pts}*PTS`);
  const outWidth = opts.resize?.width ?? 480;
  baseFilters.push(`scale=${outWidth}:-1:flags=lanczos`);

  if (opts.textOverlays && opts.textOverlays.length > 0) {
    for (const overlay of opts.textOverlays) {
      baseFilters.push(buildDrawtextFilter(overlay, outWidth, Math.round((outWidth * 9) / 16)));
    }
  }

  const qualityMap = {
    low: { dither: 'none', bayer_scale: 0 },
    medium: { dither: 'bayer', bayer_scale: 3 },
    high: { dither: 'bayer', bayer_scale: 5 },
  };
  const q = qualityMap[opts.quality];
  const paletteuse =
    q.dither === 'none'
      ? 'paletteuse=dither=none'
      : `paletteuse=dither=${q.dither}:bayer_scale=${q.bayer_scale}${opts.quality === 'high' ? ':diff_mode=rectangle' : ''}`;

  const lavfi = `${baseFilters.join(',')} [x]; [x][1:v] ${paletteuse}`;

  // Pass 2: encode GIF
  await new Promise<void>((resolve, reject) => {
    ffmpeg(inputPath)
      .seekInput(ss)
      .inputOption(`-to ${to}`)
      .input(palettePath)
      .outputOptions([`-lavfi ${lavfi}`, '-an'])
      .save(outputPath)
      .on('progress', (info: { percent?: number }) => {
        if (info.percent !== undefined) {
          onProgress(40 + Math.min(55, info.percent * 0.55));
        }
      })
      .on('end', () => resolve())
      .on('error', (e: Error) => reject(e));
  });

  cleanupFile(palettePath);

  const { size } = fs.statSync(outputPath);
  onProgress(100);

  return { outputPath, fileSizeBytes: size };
}
