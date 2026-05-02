"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type GroupItem = {
  id: number;
  name: string;
  createdAt: string;
  memberCount: number;
};

export default function ShareWorkToGroupPanel({
  workId,
  groups,
}: {
  workId: number;
  groups: GroupItem[];
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function handleShare(groupId: number) {
    if (loadingId !== null) return;

    setLoadingId(groupId);

    try {
      const res = await fetch("/api/groups/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupId,
          content: note.trim(),
          sharedWorkId: workId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "转发失败");
        return;
      }

      alert(data.message || "作品已转发到群聊");
      router.push(`/groups/${groupId}`);
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#111827" }}>选择群聊并发送</h2>
        <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>
          这里会把当前作品转发到你加入的群聊中
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <div
          style={{
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 700,
            color: "#111827",
          }}
        >
          附加备注（可选）
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="例如：这个作品发群里看看"
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

      {groups.length === 0 ? (
        <div style={{ color: "#6b7280" }}>你暂时还没有加入任何群聊，无法转发作品。</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {groups.map((item) => (
            <div key={item.id} style={cardStyle}>
              <div style={{ marginBottom: 8, fontSize: 18, fontWeight: 800, color: "#111827" }}>
                {item.name}
              </div>

              <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
                群成员：{item.memberCount} 人
              </div>

              <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 12 }}>
                创建时间：{new Date(item.createdAt).toLocaleString()}
              </div>

              <button
                type="button"
                onClick={() => handleShare(item.id)}
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
                {loadingId === item.id ? "发送中..." : "发送到该群聊"}
              </button>
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