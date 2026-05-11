import { useRef, useEffect } from 'react';
import type { TextOverlay } from '../../types/job.types';

interface CanvasOverlayProps {
  overlays: TextOverlay[];
  width: number;
  height: number;
  currentTime: number;
}

export function CanvasOverlay({ overlays, width, height, currentTime }: CanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    for (const overlay of overlays) {
      if (!overlay.text) continue;
      if (overlay.startSec !== undefined && currentTime < overlay.startSec) continue;
      if (overlay.endSec !== undefined && currentTime > overlay.endSec) continue;

      const x = (overlay.x / 100) * width;
      const y = (overlay.y / 100) * height;

      ctx.font = `bold ${overlay.fontSize}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      const metrics = ctx.measureText(overlay.text);
      const textH = overlay.fontSize * 1.2;
      const pad = 6;

      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x - pad, y - pad, metrics.width + pad * 2, textH + pad * 2);

      ctx.fillStyle = overlay.color || '#ffffff';
      ctx.fillText(overlay.text, x, y);
    }
  }, [overlays, width, height, currentTime]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="pointer-events-none absolute inset-0 w-full h-full"
    />
  );
}
