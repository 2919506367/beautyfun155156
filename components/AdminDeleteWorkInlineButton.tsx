"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminDeleteWorkInlineButton({
  workId,
  title,
}: {
  workId: number;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = window.confirm(`确定要删除作品「${title}」吗？删除后无法恢复。`);
    if (!ok) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/delete-work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "删除失败");
        setLoading(false);
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
        borderRadius: 12,
        border: "none",
        background: "#e53935",
        color: "#fff",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: 13,
      }}
    >
      {loading ? "删除中..." : "删除"}
    </button>
  );
}