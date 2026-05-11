import { useRef, useState, useEffect } from 'react';
import { CanvasOverlay } from './CanvasOverlay';
import { CropOverlay, CropRect } from './CropOverlay';
import type { TextOverlay } from '../../types/job.types';

interface VideoPreviewProps {
  src: string;
  speed: number;
  crop?: CropRect | null;
  trimStart: number;
  trimEnd: number;
  textOverlays: TextOverlay[];
  videoRef: React.RefObject<HTMLVideoElement>;
  showCropOverlay?: boolean;
  onCropChange?: (crop: CropRect | null) => void;
  onDurationChange?: (duration: number) => void;
  onTimeUpdate?: (time: number) => void;
}

export function VideoPreview({
  src,
  speed,
  crop,
  trimStart,
  trimEnd,
  textOverlays,
  videoRef,
  showCropOverlay = false,
  onCropChange,
  onDurationChange,
  onTimeUpdate,
}: VideoPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 640, height: 360 });
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed, videoRef]);

  function handleTimeUpdate() {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    onTimeUpdate?.(t);
    if (t >= trimEnd) {
      videoRef.current.currentTime = trimStart;
      videoRef.current.play().catch(() => {});
    }
  }

  // When crop is active, apply a CSS transform to give a "live zoom" feel.
  // This is cosmetic only — FFmpeg uses the raw crop rect for export.
  let cropStyle: React.CSSProperties = {};
  if (crop && crop.width > 0 && crop.height > 0 && !showCropOverlay) {
    const video = videoRef.current;
    const vw = video?.videoWidth  || 1;
    const vh = video?.videoHeight || 1;
    const scaleX = containerSize.width  / crop.width;
    const scaleY = containerSize.height / crop.height;
    const scale  = Math.min(scaleX, scaleY);
    const tx = -(crop.x / vw) * containerSize.width  * scale;
    const ty = -(crop.y / vh) * containerSize.height * scale;
    cropStyle = { transform: `scale(${scale}) translate(${tx}px, ${ty}px)`, transformOrigin: '0 0' };
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl bg-black"
      style={{ aspectRatio: '16/9' }}
    >
      <video
        ref={videoRef}
        src={src}
        className="h-full w-full object-contain transition-transform duration-150"
        style={cropStyle}
        autoPlay
        loop
        muted
        playsInline
        onLoadedMetadata={() => {
          if (videoRef.current) {
            onDurationChange?.(videoRef.current.duration);
            videoRef.current.currentTime = trimStart;
          }
        }}
        onTimeUpdate={handleTimeUpdate}
      />

      <CanvasOverlay
        overlays={textOverlays}
        width={containerSize.width}
        height={containerSize.height}
        currentTime={currentTime}
      />

      {showCropOverlay && onCropChange && (
        <CropOverlay
          videoRef={videoRef}
          crop={crop ?? null}
          onChange={onCropChange}
        />
      )}
    </div>
  );
}
