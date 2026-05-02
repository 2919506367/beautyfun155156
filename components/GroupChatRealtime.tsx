"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GroupChatBox from "@/components/GroupChatBox";
import ChatMessageBubble from "@/components/ChatMessageBubble";
import ForwardMessageModal from "@/components/ForwardMessageModal";
import { useChatSocket } from "@/hooks/useChatSocket";

type GroupMessageItem = {
  id: number;
  groupId?: number;
  content: string;
  createdAt: string;
  senderId: number;
  readAt?: string | null;
  editedAt?: string | null;
  isDeleted?: boolean;
  mentionText?: string | null;
  emoticon?: {
    id: number;
    label: string | null;
    imageUrl: string;
  } | null;
  sender: {
    id: number;
    nickname: string;
    role: "BASIC" | "GOLD" | "ADMIN";
    xp: number;
  };
  replyTo?: {
    id: number;
    content: string;
    emoticon?: {
      id: number;
      label: string | null;
      imageUrl: string;
    } | null;
    sender: {
      nickname: string;
    };
  } | null;
};

type ForwardTarget = {
  kind: "private" | "group";
  id: number;
  title: string;
  subtitle: string;
};

type MentionUser = {
  id: number;
  nickname: string;
};

type ContextMenuState = {
  messageId: number;
  x: number;
  y: number;
  isMine: boolean;
  isDeleted: boolean;
  senderLabel: string;
  content: string;
};

type GroupTypingEvent = {
  groupId: number;
  userId: number;
  isTyping: boolean;
};

function buildPreviewFromMessage(item: GroupMessageItem) {
  const prefix = `${item.sender.nickname}：`;
  if (item.isDeleted) return `${prefix}[消息已删除]`;
  if (item.content?.trim()) return `${prefix}${item.content}`;
  if (item.emoticon) return `${prefix}[表情] ${item.emoticon.label || "表情包"}`;
  return `${prefix}新消息`;
}

function upsertMessage(prev: GroupMessageItem[], item: GroupMessageItem) {
  const index = prev.findIndex((message) => message.id === item.id);
  if (index === -1) {
    return [...prev, item].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }

  const next = [...prev];
  next[index] = item;
  return next;
}

export default function GroupChatRealtime({
  groupId,
  currentUserId,
  initialMessages,
  mentionCandidates = [],
  forwardTargets = [],
}: {
  groupId: number;
  currentUserId: number;
  initialMessages: GroupMessageItem[];
  mentionCandidates?: MentionUser[];
  forwardTargets?: ForwardTarget[];
}) {
  const { socket, connected } = useChatSocket();

  const [messages, setMessages] = useState<GroupMessageItem[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [replyTarget, setReplyTarget] = useState<{
    id: number;
    content: string;
    senderLabel: string;
  } | null>(null);
  const [forwardMessageId, setForwardMessageId] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [typingUserIds, setTypingUserIds] = useState<number[]>([]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const typingTimersRef = useRef<Record<number, number>>({});
  const restorePendingRef = useRef(true);
  const lastMarkReadAtRef = useRef(0);
  const markReadInFlightRef = useRef(false);

  const storageKey = useMemo(
    () => `beautyfun-group-scroll-${currentUserId}-${groupId}`,
    [currentUserId, groupId]
  );

  const saveScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    try {
      localStorage.setItem(storageKey, String(el.scrollTop));
    } catch {}
  }, [storageKey]);

  const restoreScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw !== null) {
        el.scrollTop = Number(raw) || 0;
      }
    } catch {}
  }, [storageKey]);

  const isNearBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    saveScroll();
  }, [saveScroll]);

  const markRead = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      const now = Date.now();

      if (markReadInFlightRef.current) return;
      if (!options?.force && now - lastMarkReadAtRef.current < 1200) return;

      markReadInFlightRef.current = true;

      try {
        const res = await fetch("/api/groups/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupId,
          }),
        });

        if (!res.ok) return;

        lastMarkReadAtRef.current = Date.now();

        if (!options?.silent) {
          const latestMessage = messages[messages.length - 1];

          window.dispatchEvent(
            new CustomEvent("beautyfun-chat-summary-update", {
              detail: {
                kind: "group",
                id: groupId,
                preview: latestMessage ? buildPreviewFromMessage(latestMessage) : "",
                updatedAt: latestMessage?.createdAt || new Date().toISOString(),
                unreadCount: 0,
              },
            })
          );
        }
      } catch {
      } finally {
        markReadInFlightRef.current = false;
      }
    },
    [groupId, messages]
  );

  const loadMessages = useCallback(
    async (options?: { forceBottom?: boolean }) => {
      const wasNearBottom = isNearBottom();

      try {
        setLoading(true);
        const res = await fetch(`/api/groups/messages?groupId=${groupId}`, {
          method: "GET",
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorText(data.error || "获取群消息失败");
          return;
        }

        const nextMessages = data.messages || [];
        setMessages(nextMessages);
        setErrorText("");

        requestAnimationFrame(() => {
          if (options?.forceBottom) {
            scrollToBottom();
            return;
          }

          if (!initializedRef.current) {
            restoreScroll();
            initializedRef.current = true;
            return;
          }

          if (wasNearBottom) {
            scrollToBottom();
          } else {
            restoreScroll();
          }
        });
      } catch {
        setErrorText("获取群消息失败");
      } finally {
        setLoading(false);
      }
    },
    [groupId, isNearBottom, restoreScroll, scrollToBottom]
  );

  useEffect(() => {
    setMessages(initialMessages);
    restorePendingRef.current = true;
  }, [initialMessages]);

  useEffect(() => {
    if (!restorePendingRef.current) return;

    const timer = window.setTimeout(() => {
      restoreScroll();
      initializedRef.current = true;
      restorePendingRef.current = false;
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [messages, restoreScroll]);

  useEffect(() => {
    void markRead({ force: true, silent: true });
  }, [markRead]);

  useEffect(() => {
    function closeMenu() {
      setContextMenu(null);
    }

    function handleWindowBlur() {
      setContextMenu(null);
    }

    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  useEffect(() => {
    socket.emit("group:join", { groupId });

    function handleCreated(item: GroupMessageItem) {
      if (item.groupId !== undefined && item.groupId !== groupId) return;
      const shouldStick = isNearBottom();

      setMessages((prev) => upsertMessage(prev, item));
      setErrorText("");

      window.dispatchEvent(
        new CustomEvent("beautyfun-chat-summary-update", {
          detail: {
            kind: "group",
            id: groupId,
            preview: buildPreviewFromMessage(item),
            updatedAt: item.createdAt,
            unreadCount: item.senderId === currentUserId ? 0 : undefined,
          },
        })
      );

      requestAnimationFrame(() => {
        if (shouldStick || item.senderId === currentUserId) {
          scrollToBottom();
        } else {
          saveScroll();
        }
      });

      if (item.senderId !== currentUserId) {
        void markRead({ silent: true });
      }
    }

    function handleUpdated(item: GroupMessageItem) {
      setMessages((prev) => upsertMessage(prev, item));

      window.dispatchEvent(
        new CustomEvent("beautyfun-chat-summary-update", {
          detail: {
            kind: "group",
            id: groupId,
            preview: buildPreviewFromMessage(item),
            updatedAt: item.createdAt,
          },
        })
      );
    }

    function handleRead(detail: {
      groupId: number;
      readerUserId: number;
      readAt: string;
    }) {
      if (detail.groupId !== groupId) return;

      if (detail.readerUserId !== currentUserId) {
        return;
      }

      setMessages((prev) =>
        prev.map((item) =>
          item.senderId !== currentUserId && !item.readAt
            ? { ...item, readAt: detail.readAt }
            : item
        )
      );
    }

    function handleTyping(detail: GroupTypingEvent) {
      if (detail.groupId !== groupId) return;
      if (detail.userId === currentUserId) return;

      setTypingUserIds((prev) => {
        if (detail.isTyping) {
          return prev.includes(detail.userId) ? prev : [...prev, detail.userId];
        }
        return prev.filter((id) => id !== detail.userId);
      });

      const timer = typingTimersRef.current[detail.userId];
      if (timer) {
        window.clearTimeout(timer);
        delete typingTimersRef.current[detail.userId];
      }

      if (detail.isTyping) {
        typingTimersRef.current[detail.userId] = window.setTimeout(() => {
          setTypingUserIds((prev) => prev.filter((id) => id !== detail.userId));
          delete typingTimersRef.current[detail.userId];
        }, 3000);
      }
    }

    function handleConnect() {
      socket.emit("group:join", { groupId });
      void loadMessages();
    }

    if (socket.connected) {
      socket.emit("group:join", { groupId });
    }

    socket.on("group:message-created", handleCreated);
    socket.on("group:message-updated", handleUpdated);
    socket.on("group:read", handleRead);
    socket.on("group:typing", handleTyping);
    socket.on("connect", handleConnect);

    return () => {
      socket.emit("group:leave", { groupId });
      socket.off("group:message-created", handleCreated);
      socket.off("group:message-updated", handleUpdated);
      socket.off("group:read", handleRead);
      socket.off("group:typing", handleTyping);
      socket.off("connect", handleConnect);

      Object.values(typingTimersRef.current).forEach((timer) => {
        window.clearTimeout(timer);
      });
      typingTimersRef.current = {};
      setTypingUserIds([]);

      saveScroll();
    };
  }, [
    currentUserId,
    groupId,
    isNearBottom,
    loadMessages,
    markRead,
    saveScroll,
    scrollToBottom,
    socket,
  ]);

  async function handleEdit(messageId: number, oldContent: string) {
    const next = window.prompt("编辑消息：", oldContent);
    if (next === null) return;
    if (!next.trim()) {
      alert("修改后的内容不能为空");
      return;
    }

    try {
      const res = await fetch("/api/groups/update-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          action: "edit",
          content: next.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "修改失败");
        return;
      }

      await loadMessages();
    } catch {
      alert("请求失败，请稍后再试");
    }
  }

  async function handleDelete(messageId: number) {
    const ok = window.confirm("确定删除这条消息吗？");
    if (!ok) return;

    try {
      const res = await fetch("/api/groups/update-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messageId,
          action: "delete",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "删除失败");
        return;
      }

      await loadMessages();
    } catch {
      alert("请求失败，请稍后再试");
    }
  }

  const filteredMessages = messages.filter((item) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.trim().toLowerCase();

    return (
      item.content.toLowerCase().includes(kw) ||
      item.sender.nickname.toLowerCase().includes(kw) ||
      item.replyTo?.content?.toLowerCase().includes(kw) ||
      item.mentionText?.toLowerCase().includes(kw) ||
      item.emoticon?.label?.toLowerCase().includes(kw) ||
      item.replyTo?.emoticon?.label?.toLowerCase().includes(kw)
    );
  });

  function openContextMenu(
    e: React.MouseEvent<HTMLDivElement>,
    item: GroupMessageItem,
    senderLabel: string,
    isMine: boolean
  ) {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 178;
    const menuHeight = isMine && !item.isDeleted ? 166 : 92;
    const gap = 8;

    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth - gap) {
      x = window.innerWidth - menuWidth - gap;
    }
    if (y + menuHeight > window.innerHeight - gap) {
      y = window.innerHeight - menuHeight - gap;
    }
    if (x < gap) x = gap;
    if (y < gap) y = gap;

    setContextMenu({
      messageId: item.id,
      x,
      y,
      isMine,
      isDeleted: !!item.isDeleted,
      senderLabel,
      content: item.content,
    });
  }

  function handleReplyFromMenu() {
    if (!contextMenu) return;
    setReplyTarget({
      id: contextMenu.messageId,
      content: contextMenu.content,
      senderLabel: contextMenu.senderLabel,
    });
    setContextMenu(null);
  }

  function handleForwardFromMenu() {
    if (!contextMenu) return;
    setForwardMessageId(contextMenu.messageId);
    setContextMenu(null);
  }

  async function handleEditFromMenu() {
    if (!contextMenu) return;
    const { messageId, content } = contextMenu;
    setContextMenu(null);
    await handleEdit(messageId, content);
  }

  async function handleDeleteFromMenu() {
    if (!contextMenu) return;
    const { messageId } = contextMenu;
    setContextMenu(null);
    await handleDelete(messageId);
  }

  async function handleSentImmediateRefresh() {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }

  const typingNames = typingUserIds
    .map((id) => mentionCandidates.find((item) => item.id === id)?.nickname)
    .filter(Boolean)
    .slice(0, 3) as string[];

  return (
    <>
      <div className="chat-realtime-shell">
        <div className="chat-realtime-searchbar">
          <input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索当前群聊消息"
            className="chat-realtime-search-input"
          />
        </div>

        <div
          ref={listRef}
          onScroll={saveScroll}
          onClick={() => setContextMenu(null)}
          className="chat-message-scroll-area"
        >
          {errorText && <div className="chat-inline-error">{errorText}</div>}

          {!connected && (
            <div className="chat-inline-error">实时连接中断，正在尝试重连…</div>
          )}

          {filteredMessages.length === 0 ? (
            <div className="chat-message-empty">
              {searchKeyword ? "没有匹配的群消息。" : "还没有群消息，发第一条消息吧。"}
            </div>
          ) : (
            filteredMessages.map((item) => {
              const isMine = item.senderId === currentUserId;
              const senderLabel = isMine ? "我" : item.sender.nickname;

              return (
                <div
                  key={item.id}
                  className={`chat-message-row ${
                    isMine ? "chat-message-row-mine" : "chat-message-row-other"
                  }`}
                >
                  <ChatMessageBubble
                    isMine={isMine}
                    senderLabel={senderLabel}
                    content={item.content}
                    timeText={new Date(item.createdAt).toLocaleString()}
                    editedAt={item.editedAt || null}
                    isDeleted={item.isDeleted}
                    readAt={item.readAt || null}
                    mentionText={item.mentionText || null}
                    emoticon={item.emoticon || null}
                    replyPreview={
                      item.replyTo
                        ? {
                            senderLabel: item.replyTo.sender.nickname,
                            content: item.replyTo.content,
                            emoticon: item.replyTo.emoticon || null,
                          }
                        : null
                    }
                    onContextMenu={(e) =>
                      openContextMenu(e, item, senderLabel, isMine)
                    }
                  />
                </div>
              );
            })
          )}

          {typingNames.length > 0 && (
            <div className="chat-typing-row chat-typing-row-other">
              <div className="chat-typing-bubble">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-text">{typingNames.join("、")} 正在输入...</span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-realtime-inputbar">
          <div className="chat-input-glass-shell">
            <GroupChatBox
              groupId={groupId}
              onSent={handleSentImmediateRefresh}
              loadingMessages={loading}
              replyTarget={replyTarget}
              onCancelReply={() => setReplyTarget(null)}
              mentionCandidates={mentionCandidates}
            />
          </div>
        </div>
      </div>

      {contextMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="chat-context-menu"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <div className="chat-context-menu-head">消息操作</div>

          <button
            type="button"
            onClick={handleReplyFromMenu}
            className="chat-context-menu-btn"
          >
            回复
          </button>

          <button
            type="button"
            onClick={handleForwardFromMenu}
            className="chat-context-menu-btn"
          >
            转发
          </button>

          {contextMenu.isMine && !contextMenu.isDeleted && (
            <>
              <button
                type="button"
                onClick={handleEditFromMenu}
                className="chat-context-menu-btn"
              >
                编辑
              </button>

              <button
                type="button"
                onClick={handleDeleteFromMenu}
                className="chat-context-menu-btn chat-context-menu-btn-danger"
              >
                删除
              </button>
            </>
          )}
        </div>
      )}

      <div className="chat-forward-modal-skin">
        <ForwardMessageModal
          open={forwardMessageId !== null}
          onClose={() => setForwardMessageId(null)}
          sourceKind="group"
          messageId={forwardMessageId || 0}
          targets={forwardTargets}
          onForwarded={() => loadMessages()}
        />
      </div>
    </>
  );
}
