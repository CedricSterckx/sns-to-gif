import { useRef, useState, useEffect } from 'react';
import { CanvasOverlay } from './CanvasOverlay';
import type { TextOverlay } from '../../types/job.types';

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VideoPreviewProps {
  src: string;
  speed: number;
  crop?: CropRect | null;
  trimStart: number;
  trimEnd: number;
  textOverlays: TextOverlay[];
  videoRef: React.RefObject<HTMLVideoElement>;
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
  onDurationChange,
  onTimeUpdate,
}: VideoPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 640, height: 360 });
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    ro.observe(containerRef.current);
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

  // CSS transform for crop/zoom preview
  let cropStyle: React.CSSProperties = {};
  if (crop && crop.width > 0 && crop.height > 0) {
    const video = videoRef.current;
    const vidW = video?.videoWidth || 1;
    const vidH = video?.videoHeight || 1;
    const scaleX = containerSize.width / crop.width;
    const scaleY = containerSize.height / crop.height;
    const scale = Math.min(scaleX, scaleY);
    const tx = -(crop.x / vidW) * containerSize.width * scale;
    const ty = -(crop.y / vidH) * containerSize.height * scale;
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
        className="h-full w-full object-contain"
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
    </div>
  );
}
