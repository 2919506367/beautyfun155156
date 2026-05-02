"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useChatSocket } from "@/hooks/useChatSocket";

type ConversationItem = {
  kind: "private" | "group";
  id: number;
  title: string;
  subtitle: string;
  avatarUrl: string | null;
  preview: string;
  updatedAt: string | null;
  unreadCount: number;
};

type ChatSummaryEventDetail = {
  kind: "private" | "group";
  id: number;
  preview: string;
  updatedAt: string;
  unreadCount?: number;
};

function formatTime(value?: string | null) {
  if (!value) return "暂无消息";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function makeKey(kind: "private" | "group", id: number) {
  return `${kind}:${id}`;
}

function patchConversation(
  prev: ConversationItem[],
  detail: ChatSummaryEventDetail
) {
  const next = [...prev];
  const index = next.findIndex(
    (item) => item.kind === detail.kind && item.id === detail.id
  );

  if (index === -1) {
    return prev;
  }

  const currentItem = next[index];
  const currentTime = currentItem.updatedAt
    ? new Date(currentItem.updatedAt).getTime()
    : 0;
  const incomingTime = detail.updatedAt
    ? new Date(detail.updatedAt).getTime()
    : 0;

  if (incomingTime && currentTime && incomingTime < currentTime) {
    return prev;
  }

  next[index] = {
    ...currentItem,
    preview:
      detail.preview !== undefined ? detail.preview : currentItem.preview,
    updatedAt: detail.updatedAt || currentItem.updatedAt,
    unreadCount:
      detail.unreadCount !== undefined
        ? detail.unreadCount
        : currentItem.unreadCount,
  };

  return next;
}

export default function ChatConversationList({
  currentUserId,
  conversations,
  activeKind,
  activeId,
}: {
  currentUserId: number;
  conversations: ConversationItem[];
  activeKind: "private" | "group" | "";
  activeId: number;
}) {
  const { socket, connected } = useChatSocket();

  const [keyword, setKeyword] = useState("");
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([]);
  const [liveConversations, setLiveConversations] =
    useState<ConversationItem[]>(conversations);

  const storageKey = useMemo(
    () => `beautyfun-chat-pins-${currentUserId}`,
    [currentUserId]
  );

  useEffect(() => {
    setLiveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        setPinnedKeys(JSON.parse(raw));
      }
    } catch {}
  }, [storageKey]);

  function updatePins(next: string[]) {
    setPinnedKeys(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
  }

  function togglePin(kind: "private" | "group", id: number) {
    const key = makeKey(kind, id);
    if (pinnedKeys.includes(key)) {
      updatePins(pinnedKeys.filter((item) => item !== key));
    } else {
      updatePins([key, ...pinnedKeys]);
    }
  }

  useEffect(() => {
    async function loadSummaries() {
      try {
        const res = await fetch("/api/chats/summary", {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();
        if (!res.ok) return;

        if (Array.isArray(data.conversations)) {
          setLiveConversations(data.conversations);
        }
      } catch {}
    }

    loadSummaries();
  }, []);

  useEffect(() => {
    function handleLocalSummaryUpdate(event: Event) {
      const customEvent = event as CustomEvent<ChatSummaryEventDetail>;
      const detail = customEvent.detail;
      if (!detail) return;

      setLiveConversations((prev) => patchConversation(prev, detail));
    }

    window.addEventListener(
      "beautyfun-chat-summary-update",
      handleLocalSummaryUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        "beautyfun-chat-summary-update",
        handleLocalSummaryUpdate as EventListener
      );
    };
  }, []);

  useEffect(() => {
    function handleSocketSummary(detail: ChatSummaryEventDetail) {
      setLiveConversations((prev) => patchConversation(prev, detail));
    }

    socket.on("chat:summary-updated", handleSocketSummary);

    return () => {
      socket.off("chat:summary-updated", handleSocketSummary);
    };
  }, [socket]);

  const filtered = liveConversations
    .filter((item) => {
      if (!keyword.trim()) return true;
      const kw = keyword.trim().toLowerCase();
      return (
        item.title.toLowerCase().includes(kw) ||
        item.subtitle.toLowerCase().includes(kw) ||
        item.preview.toLowerCase().includes(kw)
      );
    })
    .sort((a, b) => {
      const aPinned = pinnedKeys.includes(makeKey(a.kind, a.id)) ? 1 : 0;
      const bPinned = pinnedKeys.includes(makeKey(b.kind, b.id)) ? 1 : 0;

      if (aPinned !== bPinned) return bPinned - aPinned;

      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

  return (
    <div className="bf-chat-conv-panel">
      <div className="bf-chat-conv-head">
        <div className="bf-chat-conv-title">聊天</div>
        <div className="bf-chat-conv-status">
          {connected ? "实时连接已建立" : "正在连接实时通道…"}
        </div>
      </div>

      <input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜索会话、最后消息"
        className="bf-chat-conv-search"
      />

      <div className="bf-chat-conv-list">
        {filtered.length === 0 ? (
          <div className="bf-chat-conv-empty">没有匹配的会话。</div>
        ) : (
          filtered.map((item) => {
            const key = makeKey(item.kind, item.id);
            const isPinned = pinnedKeys.includes(key);
            const isActive = activeKind === item.kind && activeId === item.id;

            return (
              <div
                key={key}
                className={`bf-chat-conv-item${isActive ? " bf-chat-conv-item-active" : ""}`}
              >
                <Link
                  href={`/chats?kind=${item.kind}&id=${item.id}`}
                  className="bf-chat-conv-link"
                >
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt={item.title}
                      className="bf-chat-conv-avatar"
                    />
                  ) : (
                    <div className="bf-chat-conv-avatar-fallback">
                      {item.kind === "group" ? "群" : "聊"}
                    </div>
                  )}

                  <div className="bf-chat-conv-meta">
                    <div className="bf-chat-conv-toprow">
                      <div className="bf-chat-conv-name">
                        {isPinned ? "📌 " : ""}
                        {item.title}
                      </div>

                      <div className="bf-chat-conv-time">
                        {formatTime(item.updatedAt)}
                      </div>
                    </div>

                    <div className="bf-chat-conv-subrow">
                      {item.subtitle}
                    </div>

                    <div className="bf-chat-conv-previewrow">
                      <div className={`bf-chat-conv-preview${item.unreadCount > 0 ? " bf-chat-conv-preview-unread" : ""}`}>
                        {item.preview}
                      </div>

                      {item.unreadCount > 0 && (
                        <div className="bf-chat-conv-badge">
                          {item.unreadCount > 99 ? "99+" : item.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => togglePin(item.kind, item.id)}
                  className={`bf-chat-conv-pin-btn${isPinned ? " bf-chat-conv-pin-btn-active" : ""}`}
                >
                  {isPinned ? "取消置顶" : "置顶"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
