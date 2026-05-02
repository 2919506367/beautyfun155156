"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FavoriteEmoticonButton({
  emoticonId,
}: {
  emoticonId: number;
}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleFavorite() {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/emoticons/favorite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emoticonId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "收藏失败");
        return;
      }

      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 1400);
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <motion.button
        type="button"
        onClick={handleFavorite}
        disabled={loading}
        whileHover={{ y: -1.5, scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        style={{
          marginTop: 8,
          padding: "9px 14px",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.26)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.74), rgba(255,255,255,0.24)), rgba(255,255,255,0.18)",
          color: "var(--bf-panel-text)",
          fontWeight: 900,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.72 : 1,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 22px rgba(15,23,42,0.08)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{loading ? "⏳" : "✨"}</span>
        <span>{loading ? "收藏中..." : "收藏表情包"}</span>
      </motion.button>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{
              marginTop: 8,
              padding: "8px 12px",
              borderRadius: 999,
              background: "rgba(34,197,94,0.16)",
              border: "1px solid rgba(34,197,94,0.24)",
              color: "#166534",
              fontWeight: 800,
              fontSize: 12,
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
            }}
          >
            已加入表情收藏
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}