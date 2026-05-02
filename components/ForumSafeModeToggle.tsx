"use client";

import { useEffect, useState } from "react";

export default function ForumSafeModeToggle({
  initialEnabled,
}: {
  initialEnabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("beautyfun-forum-safe-mode");
      if (raw !== null) {
        setEnabled(raw === "true");
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("beautyfun-forum-safe-mode", String(enabled));
    } catch {}
  }, [enabled]);

  async function handleToggle() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/forum/toggle-safe-mode", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "切换失败");
        return;
      }

      setEnabled(data.enabled);
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
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid #d1d5db",
        background: enabled ? "#111827" : "#fff",
        color: enabled ? "#fff" : "#111827",
        fontWeight: 800,
        cursor: "pointer",
      }}
    >
      {loading ? "切换中..." : enabled ? "论坛安全模式：开启" : "论坛安全模式：关闭"}
    </button>
  );
}