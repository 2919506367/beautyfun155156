"use client";

import { useState } from "react";

export default function AdminTestPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"BASIC" | "GOLD" | "ADMIN">("BASIC");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      alert("请输入用户邮箱");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/set-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          role,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "修改失败");
        setLoading(false);
        return;
      }

      alert(`角色修改成功：${data.user.nickname} -> ${data.user.role}`);
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: 20, color: "#111" }}>
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: 24,
          background: "#fff",
        }}
      >
        <h1 style={{ marginBottom: 20 }}>管理员测试页（本地）</h1>

        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 6 }}>用户邮箱</div>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入要修改的用户邮箱"
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ccc",
              color: "#111",
              background: "#fff",
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 6 }}>目标身份</div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "BASIC" | "GOLD" | "ADMIN")}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 10,
              border: "1px solid #ccc",
              color: "#111",
              background: "#fff",
            }}
          >
            <option value="BASIC">普通会员 BASIC</option>
            <option value="GOLD">黄金会员 GOLD</option>
            <option value="ADMIN">管理员 ADMIN</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
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
          {loading ? "修改中..." : "修改用户身份"}
        </button>
      </div>
    </main>
  );
}