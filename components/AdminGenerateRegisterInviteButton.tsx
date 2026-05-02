"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminGenerateRegisterInviteButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/generate-register-invite", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "生成失败");
        return;
      }

      alert(`生成成功，注册邀请码：${data.code}`);
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button onClick={handleGenerate} disabled={loading} style={btnStyle}>
      {loading ? "生成中..." : "生成注册邀请码"}
    </button>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};