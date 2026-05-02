"use client";

import { useState } from "react";

export default function ForumSafeReveal({
  blocked,
  children,
  message = "该内容受限制，请确认你要查看。",
}: {
  blocked: boolean;
  children: React.ReactNode;
  message?: string;
}) {
  const [revealed, setRevealed] = useState(false);

  if (!blocked || revealed) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 18,
        overflow: "hidden",
        border: "1px solid #fecaca",
        background:
          "linear-gradient(135deg, rgba(254,226,226,0.95), rgba(255,241,242,0.98))",
        minHeight: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backdropFilter: "blur(10px)",
          background: "rgba(255,255,255,0.28)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 420,
          textAlign: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 900,
            color: "#9f1239",
            marginBottom: 10,
          }}
        >
          受限制内容
        </div>

        <div
          style={{
            fontSize: 14,
            lineHeight: 1.8,
            color: "#7f1d1d",
            marginBottom: 14,
          }}
        >
          {message}
        </div>

        <button
          type="button"
          onClick={() => setRevealed(true)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          仅查看这条内容
        </button>
      </div>
    </div>
  );
}