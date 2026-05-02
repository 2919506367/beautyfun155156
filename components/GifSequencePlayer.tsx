"use client";

import { useEffect, useMemo, useState } from "react";

function getAdaptiveInterval(frameCount: number) {
  if (frameCount <= 12) return 140;
  if (frameCount <= 24) return 110;
  if (frameCount <= 48) return 85;
  if (frameCount <= 80) return 65;
  return 45;
}

export default function GifSequencePlayer({
  frames,
  title,
}: {
  frames: string[];
  title: string;
}) {
  const [index, setIndex] = useState(0);

  const interval = useMemo(() => getAdaptiveInterval(frames.length), [frames.length]);

  useEffect(() => {
    if (!frames || frames.length === 0) return;

    setIndex(0);

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % frames.length);
    }, interval);

    return () => {
      window.clearInterval(timer);
    };
  }, [frames, interval]);

  if (!frames || frames.length === 0) {
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
        }}
      >
        <img
          src={frames[index]}
          alt={title}
          loading="eager"
          style={{
            width: "100%",
            borderRadius: 20,
            display: "block",
            boxShadow: "0 20px 60px rgba(15,23,42,0.14)",
          }}
        />
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
        <Pill text={`正在播放`} />
        <Pill text={`第 ${index + 1} / ${frames.length} 帧`} />
        <Pill text={`播放间隔 ${interval}ms`} />
      </div>
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