"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PrivateChatBox from "@/components/PrivateChatBox";
import ChatMessageBubble from "@/components/ChatMessageBubble";
import ForwardMessageModal from "@/components/ForwardMessageModal";
import { useChatSocket } from "@/hooks/useChatSocket";

type MessageItem = {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  createdAt: string;
  readAt?: string | null;
  editedAt?: string | null;
  isDeleted?: boolean;
  mentionText?: string | null;
  emoticon?: {
    id: number;
    label: string | null;
    imageUrl: string;
  } | null;
  replyTo?: {
    id: number;
    content: string;
    fromUserId: number;
    emoticon?: {
      id: number;
      label: string | null;
      imageUrl: string;
    } | null;
  } | null;
};

type ForwardTarget = {
  kind: "private" | "group";
  id: number;
  title: string;
  subtitle: string;
};

type ContextMenuState = {
  messageId: number;
  x: number;
  y: number;
  isMine: boolean;
  isDeleted: boolean;
  senderLabel: string;
  content: string;
  createdAt: string;
};

type PrivateTypingEvent = {
  fromUserId: number;
  targetUserId: number;
  isTyping: boolean;
};

function buildPreviewFromMessage(item: MessageItem) {
  if (item.isDeleted) return "[消息已删除]";
  if (item.content?.trim()) return item.content;
  if (item.emoticon) return `[表情] ${item.emoticon.label || "表情包"}`;
  return "新消息";
}

function upsertMessage(prev: MessageItem[], item: MessageItem) {
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

export default function PrivateChatRealtime({
  targetUserId,
  targetUserName,
  currentUserId,
  initialMessages,
  forwardTargets = [],
}: {
  targetUserId: number;
  targetUserName: string;
  currentUserId: number;
  initialMessages: MessageItem[];
  forwardTargets?: ForwardTarget[];
}) {
  const { socket, connected } = useChatSocket();

  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [forwardMessageId, setForwardMessageId] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<{
    id: number;
    content: string;
    senderLabel: string;
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const typingHideTimerRef = useRef<number | null>(null);
  const restorePendingRef = useRef(true);
  const lastMarkReadAtRef = useRef(0);
  const markReadInFlightRef = useRef(false);

  const storageKey = useMemo(
    () => `beautyfun-private-scroll-${currentUserId}-${targetUserId}`,
    [currentUserId, targetUserId]
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
        const res = await fetch("/api/messages/private/mark-read", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            targetUserId,
          }),
        });

        if (!res.ok) return;

        lastMarkReadAtRef.current = Date.now();

        if (!options?.silent) {
          const latestMessage = messages[messages.length - 1];

          window.dispatchEvent(
            new CustomEvent("beautyfun-chat-summary-update", {
              detail: {
                kind: "private",
                id: targetUserId,
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
    [messages, targetUserId]
  );

  const loadMessages = useCallback(
    async (options?: { forceBottom?: boolean }) => {
      const wasNearBottom = isNearBottom();

      try {
        setLoading(true);
        const res = await fetch(
          `/api/messages/private/list?targetUserId=${targetUserId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          setErrorText(data.error || "获取聊天记录失败");
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
        setErrorText("获取聊天记录失败");
      } finally {
        setLoading(false);
      }
    },
    [isNearBottom, restoreScroll, scrollToBottom, targetUserId]
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
    socket.emit("private:join", { targetUserId });

    function handleCreated(item: MessageItem) {
      const related =
        (item.fromUserId === currentUserId && item.toUserId === targetUserId) ||
        (item.fromUserId === targetUserId && item.toUserId === currentUserId);

      if (!related) return;

      const shouldStick = isNearBottom();
      setMessages((prev) => upsertMessage(prev, item));
      setErrorText("");

      window.dispatchEvent(
        new CustomEvent("beautyfun-chat-summary-update", {
          detail: {
            kind: "private",
            id: targetUserId,
            preview: buildPreviewFromMessage(item),
            updatedAt: item.createdAt,
            unreadCount: item.fromUserId === targetUserId ? undefined : 0,
          },
        })
      );

      requestAnimationFrame(() => {
        if (shouldStick || item.fromUserId === currentUserId) {
          scrollToBottom();
        } else {
          saveScroll();
        }
      });

      if (item.fromUserId === targetUserId) {
        void markRead({ silent: true });
      }
    }

    function handleUpdated(item: MessageItem) {
      const related =
        (item.fromUserId === currentUserId && item.toUserId === targetUserId) ||
        (item.fromUserId === targetUserId && item.toUserId === currentUserId);

      if (!related) return;

      setMessages((prev) => upsertMessage(prev, item));

      window.dispatchEvent(
        new CustomEvent("beautyfun-chat-summary-update", {
          detail: {
            kind: "private",
            id: targetUserId,
            preview: buildPreviewFromMessage(item),
            updatedAt: item.createdAt,
          },
        })
      );
    }

    function handleRead(detail: {
      readerUserId: number;
      partnerUserId: number;
      readAt: string;
    }) {
      const matches =
        detail.readerUserId === targetUserId &&
        detail.partnerUserId === currentUserId;

      if (!matches) return;

      setMessages((prev) =>
        prev.map((item) =>
          item.fromUserId === currentUserId &&
          item.toUserId === targetUserId &&
          !item.readAt
            ? { ...item, readAt: detail.readAt }
            : item
        )
      );
    }

    function handleTyping(detail: PrivateTypingEvent) {
      if (detail.fromUserId !== targetUserId) return;

      setIsOtherTyping(!!detail.isTyping);

      if (typingHideTimerRef.current) {
        window.clearTimeout(typingHideTimerRef.current);
        typingHideTimerRef.current = null;
      }

      if (detail.isTyping) {
        typingHideTimerRef.current = window.setTimeout(() => {
          setIsOtherTyping(false);
        }, 3000);
      }
    }

    function handleConnect() {
      socket.emit("private:join", { targetUserId });
      void loadMessages();
    }

    if (socket.connected) {
      socket.emit("private:join", { targetUserId });
    }

    socket.on("private:message-created", handleCreated);
    socket.on("private:message-updated", handleUpdated);
    socket.on("private:read", handleRead);
    socket.on("private:typing", handleTyping);
    socket.on("connect", handleConnect);

    return () => {
      socket.emit("private:leave", { targetUserId });
      socket.off("private:message-created", handleCreated);
      socket.off("private:message-updated", handleUpdated);
      socket.off("private:read", handleRead);
      socket.off("private:typing", handleTyping);
      socket.off("connect", handleConnect);

      if (typingHideTimerRef.current) {
        window.clearTimeout(typingHideTimerRef.current);
      }
      setIsOtherTyping(false);

      saveScroll();
    };
  }, [
    currentUserId,
    isNearBottom,
    loadMessages,
    markRead,
    saveScroll,
    scrollToBottom,
    socket,
    targetUserId,
  ]);

  async function handleRecall(messageId: number) {
    const ok = window.confirm("确定撤回这条消息吗？");
    if (!ok) return;

    try {
      const res = await fetch("/api/messages/private/update", {
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
        alert(data.error || "撤回失败");
        return;
      }

      await loadMessages();
    } catch {
      alert("请求失败，请稍后再试");
    }
  }

  function canRecallMessage(createdAt: string) {
    const created = new Date(createdAt).getTime();
    if (Number.isNaN(created)) return false;
    return Date.now() - created <= 2 * 60 * 1000;
  }

  const filteredMessages = messages.filter((item) => {
    if (!searchKeyword.trim()) return true;
    const kw = searchKeyword.trim().toLowerCase();

    return (
      item.content.toLowerCase().includes(kw) ||
      item.replyTo?.content?.toLowerCase().includes(kw) ||
      item.mentionText?.toLowerCase().includes(kw) ||
      item.emoticon?.label?.toLowerCase().includes(kw) ||
      item.replyTo?.emoticon?.label?.toLowerCase().includes(kw)
    );
  });

  function openContextMenu(
    e: React.MouseEvent<HTMLDivElement>,
    item: MessageItem,
    senderLabel: string,
    isMine: boolean
  ) {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 172;
    const menuHeight = isMine && !item.isDeleted ? 122 : 86;
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
      createdAt: item.createdAt,
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

  async function handleRecallFromMenu() {
    if (!contextMenu) return;

    if (!canRecallMessage(contextMenu.createdAt)) {
      alert("超过两分钟的消息无法撤回");
      setContextMenu(null);
      return;
    }

    const id = contextMenu.messageId;
    setContextMenu(null);
    await handleRecall(id);
  }

  async function handleSentImmediateRefresh() {
    requestAnimationFrame(() => {
      scrollToBottom();
    });
  }

  return (
    <>
      <div className="chat-realtime-shell">
        <div className="chat-realtime-searchbar">
          <input
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索当前私聊消息"
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
              {searchKeyword ? "没有匹配的消息。" : "还没有聊天记录，发第一条消息吧。"}
            </div>
          ) : (
            filteredMessages.map((item) => {
              const isMine = item.fromUserId === currentUserId;
              const senderLabel = isMine ? "我" : targetUserName;

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
                    isDeleted={item.isDeleted}
                    readAt={item.readAt || null}
                    editedAt={item.editedAt || null}
                    mentionText={item.mentionText || null}
                    emoticon={item.emoticon || null}
                    replyPreview={
                      item.replyTo
                        ? {
                            senderLabel:
                              item.replyTo.fromUserId === currentUserId
                                ? "我"
                                : targetUserName,
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

          {isOtherTyping && (
            <div className="chat-typing-row chat-typing-row-other">
              <div className="chat-typing-bubble">
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-dot" />
                <span className="chat-typing-text">{targetUserName} 正在输入...</span>
              </div>
            </div>
          )}
        </div>

        <div className="chat-realtime-inputbar">
          <div className="chat-input-glass-shell">
            <PrivateChatBox
              targetUserId={targetUserId}
              onSent={handleSentImmediateRefresh}
              loadingMessages={loading}
              replyTarget={replyTarget}
              onCancelReply={() => setReplyTarget(null)}
            />
          </div>
        </div>
      </div>

      {contextMenu &&
        (() => {
          const canRecall =
            contextMenu.isMine &&
            !contextMenu.isDeleted &&
            canRecallMessage(contextMenu.createdAt);

          return (
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
                <button
                  type="button"
                  onClick={canRecall ? handleRecallFromMenu : undefined}
                  className={`chat-context-menu-btn ${
                    canRecall
                      ? "chat-context-menu-btn-danger"
                      : "chat-context-menu-btn-disabled"
                  }`}
                  disabled={!canRecall}
                  title={canRecall ? "撤回这条消息" : "超过两分钟无法撤回"}
                >
                  {canRecall ? "撤回" : "超过两分钟无法撤回"}
                </button>
              )}
            </div>
          );
        })()}

      <div className="chat-forward-modal-skin">
        <ForwardMessageModal
          open={forwardMessageId !== null}
          onClose={() => setForwardMessageId(null)}
          sourceKind="private"
          messageId={forwardMessageId || 0}
          targets={forwardTargets}
          onForwarded={() => loadMessages()}
        />
      </div>
    </>
  );
}
