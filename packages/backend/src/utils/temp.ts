import fs from 'fs';
import os from 'os';
import path from 'path';

export function getTempDir(): string {
  const dir = process.env.TEMP_DIR
    ? path.resolve(process.env.TEMP_DIR)
    : path.join(os.tmpdir(), 'sns-to-gif');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function getOutputDir(): string {
  const dir = process.env.OUTPUT_DIR
    ? path.resolve(process.env.OUTPUT_DIR)
    : path.join(process.cwd(), 'output');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch {
    // best-effort cleanup
  }
}
