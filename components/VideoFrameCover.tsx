"use client";

import { useEffect, useRef, useState } from "react";

const memoryPosterCache = new Map<string, string>();

function getSessionCacheKey(src: string) {
  return `beautyfun-video-poster:${src}`;
}

function readPosterFromSession(src: string) {
  if (typeof window === "undefined") return "";

  try {
    return sessionStorage.getItem(getSessionCacheKey(src)) || "";
  } catch {
    return "";
  }
}

function writePosterToSession(src: string, poster: string) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(getSessionCacheKey(src), poster);
  } catch {
    // ignore quota / private mode errors
  }
}

export default function VideoFrameCover({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [poster, setPoster] = useState<string>(() => {
    if (!src) return "";

    const fromMemory = memoryPosterCache.get(src);
    if (fromMemory) return fromMemory;

    const fromSession = readPosterFromSession(src);
    if (fromSession) {
      memoryPosterCache.set(src, fromSession);
      return fromSession;
    }

    return "";
  });

  useEffect(() => {
    if (!src) return;

    const fromMemory = memoryPosterCache.get(src);
    if (fromMemory) {
      if (poster !== fromMemory) setPoster(fromMemory);
      return;
    }

    const fromSession = readPosterFromSession(src);
    if (fromSession) {
      memoryPosterCache.set(src, fromSession);
      if (poster !== fromSession) setPoster(fromSession);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let disposed = false;

    function savePoster(dataUrl: string) {
      if (!dataUrl || disposed) return;
      memoryPosterCache.set(src, dataUrl);
      writePosterToSession(src, dataUrl);
      setPoster(dataUrl);
    }

    function captureFrame() {
      try {
      const videoEl = videoRef.current;
      if (!videoEl) return;

        const canvas = document.createElement("canvas");
        canvas.width = videoEl.videoWidth || 640;
        canvas.height = videoEl.videoHeight || 360;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        savePoster(dataUrl);
      } catch {
        // ignore capture errors
      }
    }

    function onLoadedData() {
      try {
        const videoEl = videoRef.current;
      if (!videoEl) return;

      videoEl.currentTime = 0.1;
      } catch {
        captureFrame();
      }
    }

    function onSeeked() {
      captureFrame();
    }

    function onError() {
      // keep fallback UI
    }

    video.addEventListener("loadeddata", onLoadedData);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);

    return () => {
      disposed = true;
      video.removeEventListener("loadeddata", onLoadedData);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
  }, [src, poster]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        background: "#e5e7eb",
      }}
    >
      {poster ? (
        <img
          src={poster}
          alt={alt}
          loading="lazy"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #dbe4f0 0%, #eef2f7 100%)",
            color: "#334155",
            fontWeight: 800,
            fontSize: 20,
          }}
        >
          ▶ VIDEO
        </div>
      )}

      {!poster && (
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          preload="metadata"
          style={{ display: "none" }}
        />
      )}
    </div>
  );
}