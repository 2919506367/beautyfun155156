"use client";

import { useEffect, useMemo, useState } from "react";

export default function ForumJpegSequencePlayer({
  frames,
}: {
  frames: { id: number; url: string }[];
}) {
  const validFrames = useMemo(() => frames.filter((f) => !!f.url), [frames]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing || validFrames.length <= 1) return;

    const timer = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % validFrames.length);
    }, 120);

    return () => {
      window.clearInterval(timer);
    };
  }, [playing, validFrames.length]);

  if (validFrames.length === 0) return null;

  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <img
        src={validFrames[index].url}
        alt="jpeg sequence frame"
        style={{
          width: "100%",
          display: "block",
          objectFit: "cover",
        }}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          padding: 12,
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          JPG序列帧：{index + 1} / {validFrames.length}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            style={btnStyle}
          >
            {playing ? "暂停" : "播放"}
          </button>

          <button
            type="button"
            onClick={() =>
              setIndex((prev) =>
                prev === 0 ? validFrames.length - 1 : prev - 1
              )
            }
            style={btnStyle}
          >
            上一帧
          </button>

          <button
            type="button"
            onClick={() => setIndex((prev) => (prev + 1) % validFrames.length)}
            style={btnStyle}
          >
            下一帧
          </button>
        </div>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
  cursor: "pointer",
};