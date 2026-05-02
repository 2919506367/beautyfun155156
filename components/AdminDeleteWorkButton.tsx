"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminDeleteWorkButton({ workId }: { workId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const ok = window.confirm("确定要删除这个作品吗？删除后无法恢复。");
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

      alert("删除成功");
      router.push("/");
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
        padding: "10px 16px",
        borderRadius: 16,
        border: "1px solid rgba(229,57,53,0.26)",
        background:
          "linear-gradient(180deg, rgba(255,182,182,0.92), rgba(229,57,53,0.72))",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.22), 0 12px 28px rgba(229,57,53,0.18)",
        opacity: loading ? 0.72 : 1,
      }}
    >
      {loading ? "删除中..." : "管理员删除作品"}
    </button>
  );
}