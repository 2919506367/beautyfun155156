"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForumPinToggleButton({
  postId,
  pinned,
}: {
  postId: number;
  pinned: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/forum/admin/toggle-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "切换置顶失败");
        return;
      }

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
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #d1d5db",
        background: pinned ? "#111827" : "#fff",
        color: pinned ? "#fff" : "#111827",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {loading ? "处理中..." : pinned ? "取消置顶" : "设为置顶"}
    </button>
  );
}