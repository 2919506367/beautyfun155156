"use client";

import { useState } from "react";

export default function UserFriendActions({
  targetUserId,
}: {
  targetUserId: number;
}) {
  const [loading, setLoading] = useState(false);

  async function handleAddFriend() {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/friends/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "发送失败");
        return;
      }

      alert(data.message || "好友申请已发送");
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        marginTop: 18,
        paddingTop: 18,
        borderTop: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 12,
        }}
      >
        社交入口
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleAddFriend}
          disabled={loading}
          style={{
            padding: "12px 18px",
            borderRadius: 14,
            border: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "发送中..." : "添加好友"}
        </button>

<a
  href={`/messages/private/${targetUserId}`}
  style={{
    padding: "12px 18px",
    borderRadius: 14,
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#111827",
    fontWeight: 800,
    textDecoration: "none",
    display: "inline-block",
  }}
>
  发私信
</a>
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 13,
          color: "#6b7280",
          lineHeight: 1.7,
        }}
      >
        目前已接通好友申请，私聊功能下一步继续接。
      </div>
    </div>
  );
}