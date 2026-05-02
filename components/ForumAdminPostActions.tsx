"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ForumAdminPostActions({
  postId,
}: {
  postId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = window.confirm("确定删除这篇论坛帖子吗？");
    if (!ok) return;

    setLoading(true);

    try {
      const res = await fetch("/api/forum/admin/delete", {
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
        alert(data.error || "删除失败");
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
      onClick={handleDelete}
      disabled={loading}
      style={{
        padding: "8px 12px",
        borderRadius: 10,
        border: "1px solid #fecdd3",
        background: "#fff1f2",
        color: "#be123c",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {loading ? "删除中..." : "删除帖子"}
    </button>
  );
}