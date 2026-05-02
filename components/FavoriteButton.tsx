"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function FavoriteButton({
  workId,
  initialFavorited,
}: {
  workId: number;
  initialFavorited: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [favorited, setFavorited] = useState(initialFavorited);

  async function handleToggle() {
    setLoading(true);

    try {
      const res = await fetch("/api/favorite/toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "收藏操作失败");
        setLoading(false);
        return;
      }

      setFavorited(data.action === "added");
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      style={{
        padding: "10px 16px",
        borderRadius: 16,
        border: favorited
          ? "1px solid rgba(212,175,55,0.30)"
          : "1px solid rgba(255,255,255,0.30)",
        background: favorited
          ? "linear-gradient(180deg, rgba(255,230,140,0.92), rgba(212,175,55,0.62))"
          : "linear-gradient(180deg, rgba(255,255,255,0.76), rgba(255,255,255,0.26)), rgba(255,255,255,0.22)",
        color: favorited ? "#3b2f08" : "var(--bf-panel-text)",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: favorited
          ? "inset 0 1px 0 rgba(255,255,255,0.30), 0 12px 28px rgba(212,175,55,0.18)"
          : "inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(15,23,42,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: loading ? 0.72 : 1,
      }}
    >
      {loading ? "处理中..." : favorited ? "取消收藏" : "加入收藏"}
    </button>
  );
}