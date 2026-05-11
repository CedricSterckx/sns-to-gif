import { useRef, useEffect } from 'react';

export function useVideoPreview(speed: number, startSec: number) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  function seekTo(time: number) {
    if (videoRef.current) videoRef.current.currentTime = time;
  }

  function playFromTrim() {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = startSec;
    video.play().catch(() => {});
  }

  return { videoRef, seekTo, playFromTrim };
}
