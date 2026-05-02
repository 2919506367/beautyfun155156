"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminSetUserRoleInline({
  account,
  currentRole,
}: {
  account: string;
  currentRole: "BASIC" | "GOLD" | "ADMIN";
}) {
  const router = useRouter();
  const [role, setRole] = useState<"BASIC" | "GOLD" | "ADMIN">(currentRole);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "修改失败");
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
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "BASIC" | "GOLD" | "ADMIN")}
        style={{
          padding: "8px 10px",
          borderRadius: 12,
          border: "1px solid #d1d5db",
          background: "#fff",
          color: "#111827",
          fontSize: 13,
          minWidth: 120,
        }}
      >
        <option value="BASIC">普通会员</option>
        <option value="GOLD">黄金会员</option>
        <option value="ADMIN">管理员</option>
      </select>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        style={{
          padding: "8px 12px",
          borderRadius: 12,
          border: "none",
          background: "#111827",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {loading ? "保存中..." : "保存"}
      </button>
    </div>
  );
}