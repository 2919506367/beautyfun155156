"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MembershipPanel({
  role,
}: {
  role: "BASIC" | "GOLD" | "ADMIN";
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRedeem() {
    if (role !== "BASIC") {
      alert("当前账号无需兑换。");
      return;
    }

    if (!code.trim()) {
      alert("请输入 CDK。");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/membership/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "兑换失败");
        return;
      }

      alert("兑换成功，已升级为黄金会员");
      router.refresh();
      window.location.reload();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  
  return (
    <div style={{ display: "grid", gap: 20 }}>
     
      <div style={cardStyle}>
        <div style={titleStyle}>兑换 CDK</div>
        <div style={descStyle}>输入管理员生成的兑换码，将普通用户升级为黄金会员。</div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="请输入 CDK"
            style={inputStyle}
          />
          <button onClick={handleRedeem} disabled={loading} style={primaryBtn}>
            {loading ? "兑换中..." : "立即兑换"}
          </button>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 18,
  background: "#fafafa",
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 800,
  color: "#111827",
  marginBottom: 8,
};

const descStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#6b7280",
  marginBottom: 14,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 220,
  padding: 12,
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
};

const primaryBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};