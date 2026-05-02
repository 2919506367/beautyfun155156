"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminSetUserStatusInline({
  account,
  initialIsBanned,
  initialIsMuted,
}: {
  account: string;
  initialIsBanned: boolean;
  initialIsMuted: boolean;
}) {
  const router = useRouter();
  const [isBanned, setIsBanned] = useState(initialIsBanned);
  const [isMuted, setIsMuted] = useState(initialIsMuted);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/users/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account,
          isBanned,
          isMuted,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "保存失败");
        return;
      }

      alert(data.message || "保存成功");
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-end",
        minWidth: 180,
      }}
    >
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "#111827",
          fontWeight: 700,
        }}
      >
        <input
          type="checkbox"
          checked={isBanned}
          onChange={(e) => setIsBanned(e.target.checked)}
        />
        封禁账号
      </label>

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13,
          color: "#111827",
          fontWeight: 700,
        }}
      >
        <input
          type="checkbox"
          checked={isMuted}
          onChange={(e) => setIsMuted(e.target.checked)}
        />
        禁言账号
      </label>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: "none",
          background: "#111827",
          color: "#fff",
          fontWeight: 800,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "保存中..." : "保存状态"}
      </button>
    </div>
  );
}