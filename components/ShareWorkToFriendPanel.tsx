"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import UserIdentity from "@/components/UserIdentity";

type FriendItem = {
  friendshipId: number;
  friend: {
    id: number;
    nickname: string;
    account: string;
    avatarUrl: string | null;
    role: "BASIC" | "GOLD" | "ADMIN";
    xp: number | null;
  };
};

export default function ShareWorkToFriendPanel({
  workId,
  friends,
}: {
  workId: number;
  friends: FriendItem[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleShare(targetUserId: number) {
    if (loadingId !== null) return;

    setLoadingId(targetUserId);

    try {
      const res = await fetch("/api/messages/private/share-work", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId,
          workId,
          note: note.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "分享失败");
        return;
      }

      alert(data.message || "作品分享成功");
      router.push(`/messages/private/${targetUserId}`);
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#111827" }}>选择好友并发送</h2>
        <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>
          这里会把当前作品转发到你和好友的私聊中
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: "#111827" }}>
          附加备注（可选）
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="例如：这个作品挺不错，发给你看看"
          style={{
            width: "100%",
            resize: "vertical",
            borderRadius: 14,
            border: "1px solid #d1d5db",
            padding: 14,
            fontSize: 14,
            color: "#111827",
            background: "#fff",
            outline: "none",
            lineHeight: 1.7,
          }}
        />
      </div>

      {friends.length === 0 ? (
        <div style={{ color: "#6b7280" }}>你暂时还没有好友，无法转发作品。</div>
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
                      flexShrink: 0,
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
                      flexShrink: 0,
                    }}
                  >
                    无头像
                  </div>
                )}

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ marginBottom: 8 }}>
                    <UserIdentity
                      userId={item.friend.id}
                      nickname={item.friend.nickname}
                      role={item.friend.role}
                      xp={item.friend.xp}
                    />
                  </div>

                  <div style={{ fontSize: 14, color: "#374151", marginBottom: 10 }}>
                    账号：{item.friend.account}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleShare(item.friend.id)}
                    disabled={loadingId !== null}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "none",
                      background: "#111827",
                      color: "#fff",
                      fontWeight: 700,
                      cursor: loadingId !== null ? "not-allowed" : "pointer",
                      opacity: loadingId !== null ? 0.7 : 1,
                    }}
                  >
                    {loadingId === item.friend.id ? "发送中..." : "发送给TA"}
                  </button>
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
};

const cardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 16,
};