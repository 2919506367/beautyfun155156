"use client";

import { useMemo, useState } from "react";

type TargetItem = {
  kind: "private" | "group";
  id: number;
  title: string;
  subtitle: string;
};

export default function ForwardMessageModal({
  open,
  onClose,
  sourceKind,
  messageId,
  targets,
  onForwarded,
}: {
  open: boolean;
  onClose: () => void;
  sourceKind: "private" | "group";
  messageId: number;
  targets: TargetItem[];
  onForwarded?: () => void | Promise<void>;
}) {
  const [keyword, setKeyword] = useState("");
  const [loadingKey, setLoadingKey] = useState("");

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return targets;
    return targets.filter((item) => {
      return (
        item.title.toLowerCase().includes(kw) ||
        item.subtitle.toLowerCase().includes(kw)
      );
    });
  }, [keyword, targets]);

  if (!open) return null;

  async function handleForward(targetKind: "private" | "group", targetId: number) {
    const key = `${targetKind}-${targetId}`;
    setLoadingKey(key);

    try {
      const res = await fetch("/api/messages/forward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceKind,
          messageId,
          targetKind,
          targetId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "转发失败");
        return;
      }

      alert(data.message || "转发成功");
      onClose();
      await onForwarded?.();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoadingKey("");
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          maxHeight: "80vh",
          overflow: "auto",
          background: "#fff",
          borderRadius: 22,
          padding: 20,
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#111827",
            marginBottom: 12,
          }}
        >
          转发消息
        </div>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索好友或群聊"
          style={{
            width: "100%",
            borderRadius: 12,
            border: "1px solid #d1d5db",
            padding: "12px 14px",
            fontSize: 14,
            color: "#111827",
            background: "#fff",
            outline: "none",
            marginBottom: 14,
          }}
        />

        <div style={{ display: "grid", gap: 10 }}>
          {filtered.length === 0 ? (
            <div style={{ color: "#6b7280" }}>没有可转发目标。</div>
          ) : (
            filtered.map((item) => {
              const key = `${item.kind}-${item.id}`;
              return (
                <div
                  key={key}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 14,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      {item.kind === "group" ? "👥 " : "💬 "}
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#6b7280",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleForward(item.kind, item.id)}
                    disabled={loadingKey === key}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: "none",
                      background: "#111827",
                      color: "#fff",
                      fontWeight: 800,
                      cursor: "pointer",
                      opacity: loadingKey === key ? 0.7 : 1,
                      flexShrink: 0,
                    }}
                  >
                    {loadingKey === key ? "转发中..." : "转发"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            marginTop: 18,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#111827",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}