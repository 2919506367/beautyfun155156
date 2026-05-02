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

export default function CreateGroupPanel({
  friends,
}: {
  friends: FriendItem[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  function toggleUser(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handleCreate() {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          memberIds: selectedIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "创建失败");
        return;
      }

      router.push(`/groups/${data.groupId}`);
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#111827" }}>创建群聊</h2>
        <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>
          先选择好友，再输入群聊名称
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div style={{ marginBottom: 8, fontSize: 14, fontWeight: 700, color: "#111827" }}>
          群聊名称
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：摄影交流群"
          style={inputStyle}
        />
      </div>

      {friends.length === 0 ? (
        <div style={{ color: "#6b7280" }}>你暂时没有好友，无法创建群聊。</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {friends.map((item) => {
            const checked = selectedIds.includes(item.friend.id);

            return (
              <label key={item.friendshipId} style={rowStyle}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleUser(item.friend.id)}
                  />

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ marginBottom: 6 }}>
                      <UserIdentity
                        userId={item.friend.id}
                        nickname={item.friend.nickname}
                        role={item.friend.role}
                        xp={item.friend.xp}
                      />
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280" }}>
                      账号：{item.friend.account}
                    </div>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          style={{
            padding: "10px 16px",
            borderRadius: 12,
            border: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 800,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "创建中..." : "创建群聊"}
        </button>
      </div>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 24,
};

const rowStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 16,
  padding: 14,
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  padding: "12px 14px",
  fontSize: 14,
  color: "#111827",
  background: "#fff",
  outline: "none",
};