"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function CommentLikeButton({
  commentId,
  initialLikeCount,
}: {
  commentId: number;
  initialLikeCount: number;
}) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);
  const [likedPulse, setLikedPulse] = useState(false);

  async function handleLike() {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/comment/like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "点赞失败");
        return;
      }

      setLikeCount(data.likeCount ?? likeCount);
      setLikedPulse(true);
      window.setTimeout(() => setLikedPulse(false), 260);
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleLike}
      disabled={loading}
      whileHover={{ y: -1.5, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      animate={
        likedPulse
          ? {
              scale: [1, 1.08, 0.98, 1],
            }
          : undefined
      }
      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
      style={{
        padding: "8px 13px",
        borderRadius: 999,
        border: "1px solid rgba(255,255,255,0.26)",
        background: likedPulse
          ? "linear-gradient(180deg, rgba(255,210,214,0.96), rgba(255,128,149,0.74))"
          : "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.24)), rgba(255,255,255,0.18)",
        color: likedPulse ? "#7a1732" : "var(--bf-panel-text)",
        fontSize: 13,
        fontWeight: 900,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: likedPulse
          ? "inset 0 1px 0 rgba(255,255,255,0.28), 0 12px 26px rgba(255,94,125,0.18)"
          : "inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 22px rgba(15,23,42,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: loading ? 0.72 : 1,
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span>{likedPulse ? "💗" : "👍"}</span>
      <span>{loading ? "处理中..." : likeCount}</span>
    </motion.button>
  );
}