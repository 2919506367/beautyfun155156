"use client";

import { useEffect, useMemo, useState } from "react";

function getAdaptiveInterval(frameCount: number) {
  if (frameCount <= 12) return 140;
  if (frameCount <= 24) return 110;
  if (frameCount <= 48) return 85;
  if (frameCount <= 80) return 65;
  return 45;
}

type LoadState = "idle" | "loading" | "ready" | "error";

export default function GifSequencePlayer({
  frames,
  title,
}: {
  frames: string[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [loadedCount, setLoadedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const safeFrames = useMemo(
    () => frames.filter((frame) => typeof frame === "string" && frame.trim()),
    [frames]
  );

  const interval = useMemo(
    () => getAdaptiveInterval(safeFrames.length),
    [safeFrames.length]
  );

  const progress = safeFrames.length
    ? Math.round(((loadedCount + failedCount) / safeFrames.length) * 100)
    : 0;

  useEffect(() => {
    let cancelled = false;
    const loadedImages: HTMLImageElement[] = [];

    setIndex(0);
    setLoadedCount(0);
    setFailedCount(0);

    if (!safeFrames.length) {
      setLoadState("error");
      return;
    }

    setLoadState("loading");

    async function preloadAllFrames() {
      await Promise.all(
        safeFrames.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              loadedImages.push(img);

              img.onload = () => {
                if (!cancelled) {
                  setLoadedCount((prev) => prev + 1);
                }
                resolve();
              };

              img.onerror = () => {
                if (!cancelled) {
                  setFailedCount((prev) => prev + 1);
                }
                resolve();
              };

              img.src = src;
            })
        )
      );

      if (!cancelled) {
        setLoadState("ready");
      }
    }

    preloadAllFrames();

    return () => {
      cancelled = true;
      loadedImages.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [safeFrames]);

  useEffect(() => {
    if (loadState !== "ready" || safeFrames.length === 0) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeFrames.length);
    }, interval);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadState, safeFrames.length, interval]);

  if (!safeFrames.length) {
    return (
      <div
        style={{
          color: "var(--bf-panel-text-soft)",
          textAlign: "center",
          padding: 20,
        }}
      >
        动图帧不存在
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 960,
        margin: "0 auto",
      }}
    >
      <div
        style={{
          borderRadius: 28,
          padding: 14,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.20)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={safeFrames[index] || safeFrames[0]}
          alt={title}
          loading="eager"
          decoding="sync"
          style={{
            width: "100%",
            borderRadius: 20,
            display: "block",
            boxShadow: "0 20px 60px rgba(15,23,42,0.14)",
            opacity: loadState === "ready" ? 1 : 0.42,
            filter: loadState === "ready" ? "none" : "blur(10px)",
            transform: loadState === "ready" ? "none" : "scale(1.015)",
            transition: "opacity 0.22s ease, filter 0.22s ease, transform 0.22s ease",
          }}
        />

        {loadState !== "ready" && (
          <div
            style={{
              position: "absolute",
              inset: 14,
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.42), rgba(15,23,42,0.58))",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#fff",
              padding: 20,
              textAlign: "center",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: 14,
                justifyItems: "center",
                width: "min(360px, 100%)",
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  border: "4px solid rgba(255,255,255,0.28)",
                  borderTopColor: "rgba(255,255,255,0.95)",
                  animation: "bfGifSpin 0.9s linear infinite",
                }}
              />

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                }}
              >
                正在加载完整动图序列
              </div>

              <div
                style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: "rgba(255,255,255,0.78)",
                }}
              >
                已加载 {loadedCount + failedCount} / {safeFrames.length} 帧
                {failedCount > 0 ? `，失败 ${failedCount} 帧` : ""}
              </div>

              <div
                style={{
                  width: "100%",
                  height: 9,
                  borderRadius: 999,
                  overflow: "hidden",
                  background: "rgba(255,255,255,0.22)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                <div
                  style={{
                    width: `${progress}%`,
                    height: "100%",
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.58), rgba(255,255,255,0.95))",
                    transition: "width 0.18s ease",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.82)",
                }}
              >
                {progress}%
              </div>
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <Pill text={loadState === "ready" ? "正在播放" : "加载中"} />
        <Pill text={`第 ${loadState === "ready" ? index + 1 : 1} / ${safeFrames.length} 帧`} />
        <Pill text={`播放间隔 ${interval}ms`} />
      </div>

      <style jsx>{`
        @keyframes bfGifSpin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

function Pill({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color: "var(--bf-panel-text)",
        background: "rgba(255,255,255,0.18)",
        border: "1px solid rgba(255,255,255,0.26)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
      }}
    >
      {text}
    </div>
  );
}
