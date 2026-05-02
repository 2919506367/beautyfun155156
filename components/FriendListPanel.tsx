"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import UserIdentity from "@/components/UserIdentity";

type FriendItem = {
  friendshipId: number;
  createdAt: string;
  friend: {
    id: number;
    nickname: string;
    account: string;
    avatarUrl: string | null;
    role: "BASIC" | "GOLD" | "ADMIN";
    xp: number | null;
  };
};

export default function FriendListPanel({
  friends,
}: {
  friends: FriendItem[];
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleDelete(friendshipId: number) {
    if (loadingId !== null) return;

    const ok = window.confirm("确定要删除这位好友吗？");
    if (!ok) return;

    setLoadingId(friendshipId);

    try {
      const res = await fetch("/api/friends/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          friendshipId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "删除失败");
        return;
      }

      alert(data.message || "已删除好友");
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
        <h2 style={{ margin: 0, color: "#111827" }}>我的好友</h2>
        <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>
          这里显示已经互相通过申请的好友
        </div>
      </div>

      {friends.length === 0 ? (
        <div style={{ color: "#6b7280" }}>你暂时还没有好友。</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {friends.map((item) => (
            <div key={item.friendshipId} style={cardStyle}>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <Link
                  href={`/users/${item.friend.id}`}
                  style={{ textDecoration: "none", flexShrink: 0 }}
                >
                  {item.friend.avatarUrl ? (
                    <img
                      src={item.friend.avatarUrl}
                      alt={item.friend.nickname}
                      style={{
                        width: 68,
                        height: 68,
                        objectFit: "cover",
                        borderRadius: "50%",
                        border: "1px solid #e5e7eb",
                        background: "#f3f4f6",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 68,
                        height: 68,
                        borderRadius: "50%",
                        border: "1px solid #e5e7eb",
                        background: "#eef2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#6b7280",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      无头像
                    </div>
                  )}
                </Link>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ marginBottom: 8 }}>
                    <UserIdentity
                      userId={item.friend.id}
                      nickname={item.friend.nickname}
                      role={item.friend.role}
                      xp={item.friend.xp}
                    />
                  </div>

                  <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
                    账号：{item.friend.account}
                  </div>

                  <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 10 }}>
                    成为好友时间：{new Date(item.createdAt).toLocaleString()}
                  </div>

                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <Link href={`/users/${item.friend.id}`} style={linkBtnStyle}>
                      查看资料
                    </Link>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.friendshipId)}
                      disabled={loadingId !== null}
                      style={{
                        ...dangerBtnStyle,
                        opacity: loadingId !== null ? 0.7 : 1,
                        cursor: loadingId !== null ? "not-allowed" : "pointer",
                      }}
                    >
                      {loadingId === item.friendshipId ? "删除中..." : "删除好友"}
                    </button>

                    <Link href={`/chats?kind=private&id=${item.friend.id}`} style={ghostBtnStyle}>
                      发私信
                    </Link>
                  </div>
                </div>
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

const cardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 16,
};

const linkBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  background: "#111827",
  color: "#fff",
  textDecoration: "none",
  display: "inline-block",
  fontWeight: 700,
};

const ghostBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  fontWeight: 700,
  textDecoration: "none",
  display: "inline-block",
};

const dangerBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#fff1f2",
  color: "#be123c",
  fontWeight: 700,
};