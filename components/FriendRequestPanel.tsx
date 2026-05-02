"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type FriendRequestItem = {
  id: number;
  createdAt: string;
  fromUser: {
    id: number;
    nickname: string;
    account: string;
  };
};

export default function FriendRequestPanel({
  requests,
}: {
  requests: FriendRequestItem[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleRespond(requestId: number, action: "accept" | "reject") {
    if (loadingId !== null) return;

    setLoadingId(requestId);

    try {
      const res = await fetch("/api/friends/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requestId,
          action,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "操作失败");
        return;
      }

      alert(data.message || "操作成功");
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#111827" }}>好友申请</h2>
        <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>
          这里会显示别人发给你的好友申请
        </div>
      </div>

      {requests.length === 0 ? (
        <div style={{ color: "#6b7280" }}>暂时还没有新的好友申请。</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {requests.map((item) => (
            <div key={item.id} style={rowStyle}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
                  {item.fromUser.nickname}
                </div>

                <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
                  账号：{item.fromUser.account}
                </div>

                <div style={{ fontSize: 13, color: "#6b7280" }}>
                  申请时间：{new Date(item.createdAt).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => handleRespond(item.id, "accept")}
                  disabled={loadingId !== null}
                  style={{
                    ...primaryBtnStyle,
                    opacity: loadingId !== null ? 0.7 : 1,
                    cursor: loadingId !== null ? "not-allowed" : "pointer",
                  }}
                >
                  {loadingId === item.id ? "处理中..." : "同意"}
                </button>

                <button
                  type="button"
                  onClick={() => handleRespond(item.id, "reject")}
                  disabled={loadingId !== null}
                  style={{
                    ...secondaryBtnStyle,
                    opacity: loadingId !== null ? 0.7 : 1,
                    cursor: loadingId !== null ? "not-allowed" : "pointer",
                  }}
                >
                  拒绝
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 24,
  marginTop: 24,
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 16,
  flexWrap: "wrap",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 16,
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
};