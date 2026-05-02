"use client";

import { useEffect, useRef } from "react";

interface GifPlayerProps {
  frames: string[]; // 图片序列路径
  fps?: number;
  width?: number;
  height?: number;
}

export default function GifPlayer({ frames, fps = 12, width, height }: GifPlayerProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const frameIndex = useRef(0);
  const interval = 1000 / fps;

  useEffect(() => {
    if (!frames || frames.length === 0) return;

    const timer = setInterval(() => {
      if (imgRef.current) {
        imgRef.current.src = frames[frameIndex.current];
        frameIndex.current = (frameIndex.current + 1) % frames.length;
      }
    }, interval);

    return () => clearInterval(timer);
  }, [frames, interval]);

  return <img ref={imgRef} width={width} height={height} />;
}