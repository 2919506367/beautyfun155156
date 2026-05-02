"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "退出失败");
        setLoading(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      alert("退出失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        border: "none",
        background: "#111",
        color: "#fff",
        cursor: "pointer",
      }}
    >
      {loading ? "退出中..." : "退出登录"}
    </button>
  );
}