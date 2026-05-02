"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import EmoticonPicker from "@/components/EmoticonPicker";
import { useChatSocket } from "@/hooks/useChatSocket";

type ReplyTarget = {
  id: number;
  content: string;
  senderLabel: string;
};

export default function PrivateChatBox({
  targetUserId,
  onSent,
  loadingMessages = false,
  replyTarget,
  onCancelReply,
}: {
  targetUserId: number;
  onSent?: () => void | Promise<void>;
  loadingMessages?: boolean;
  replyTarget?: ReplyTarget | null;
  onCancelReply?: () => void;
}) {
  const { socket } = useChatSocket();

  const draftKey = useMemo(
    () => `beautyfun-private-draft-${targetUserId}`,
    [targetUserId]
  );

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [selectedEmoticonId, setSelectedEmoticonId] = useState<number | null>(null);
  const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);
  const typingTimerRef = useRef<number | null>(null);
const typingHeartbeatRef = useRef<number | null>(null);
const isFocusedRef = useRef(false);

function reportTyping(isTyping: boolean) {
  socket.emit("private:typing", {
    targetUserId,
    isTyping,
  });
}

function clearTypingTimers() {
  if (typingTimerRef.current) {
    window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = null;
  }

  if (typingHeartbeatRef.current) {
    window.clearInterval(typingHeartbeatRef.current);
    typingHeartbeatRef.current = null;
  }
}

function startTypingPresence() {
  isFocusedRef.current = true;
  reportTyping(true);

  if (typingHeartbeatRef.current) {
    window.clearInterval(typingHeartbeatRef.current);
  }

  typingHeartbeatRef.current = window.setInterval(() => {
    if (isFocusedRef.current) {
      reportTyping(true);
    }
  }, 1800);
}

function stopTypingPresence() {
  isFocusedRef.current = false;
  clearTypingTimers();
  reportTyping(false);
}

function triggerTyping() {
  reportTyping(true);

  if (typingTimerRef.current) {
    window.clearTimeout(typingTimerRef.current);
  }

  typingTimerRef.current = window.setTimeout(() => {
    if (!isFocusedRef.current) {
      reportTyping(false);
    }
    typingTimerRef.current = null;
  }, 2600);
}
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw !== null) {
        setContent(raw);
      }
    } catch {}
  }, [draftKey]);

  useEffect(() => {
    try {
      localStorage.setItem(draftKey, content);
    } catch {}
  }, [draftKey, content]);

useEffect(() => {
  return () => {
    clearTypingTimers();
    reportTyping(false);
  };
}, [targetUserId]);
  async function handleSend() {
    const text = content.trim();
    if ((!text && selectedEmoticonId === null) || loading) return;

    setLoading(true);
    setNotice("");

    try {
      const res = await fetch("/api/messages/private/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetUserId,
          content: text,
          emoticonId: selectedEmoticonId,
          replyToId: replyTarget?.id ?? null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice(data.error || "发送失败");
        return;
      }

      setContent("");
      setSelectedEmoticonId(null);
      setShowEmoticonPicker(false);
      reportTyping(false);

      try {
        localStorage.removeItem(draftKey);
      } catch {}

      onCancelReply?.();

      if (onSent) {
        await onSent();
      }
    } catch {
      setNotice("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      stopTypingPresence();	
    }
  }

  return (
    <div className="chatbox-shell">
      {replyTarget && (
        <div className="chatbox-reply-card">
          <div className="chatbox-reply-head">
            <div className="chatbox-reply-title">回复 {replyTarget.senderLabel}</div>

            <button
              type="button"
              onClick={onCancelReply}
              className="chatbox-inline-action-btn"
            >
              取消回复
            </button>
          </div>

          <div className="chatbox-reply-content">{replyTarget.content}</div>
        </div>
      )}

      {notice && <div className="chatbox-notice chatbox-notice-error">{notice}</div>}

      <div className="chatbox-toolbar-row">
        <div className="chatbox-mode-pill">私聊发送</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setShowEmoticonPicker((prev) => !prev)}
            className="chatbox-inline-action-btn"
          >
            {showEmoticonPicker ? "收起表情" : "表情包"}
          </button>
          {selectedEmoticonId !== null && (
            <span className="chatbox-tip-text">已选表情 #{selectedEmoticonId}</span>
          )}
          <div className="chatbox-tip-text">Enter 发送，Shift + Enter 换行</div>
        </div>
      </div>

      {showEmoticonPicker && (
        <div style={{ marginBottom: 12 }}>
          <EmoticonPicker
            selectedId={selectedEmoticonId}
            onSelect={(id) => {
              setSelectedEmoticonId(id);
              triggerTyping();
            }}
          />
        </div>
      )}

      <div className="chatbox-grid">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            triggerTyping();
          }}
onFocus={() => {
  startTypingPresence();
}}
onBlur={() => {
  stopTypingPresence();
}}
          onKeyDown={handleKeyDown}
          placeholder="输入消息，Enter 发送，Shift + Enter 换行"
          rows={3}
          className="chatbox-textarea"
        />

        <button
          type="button"
          onClick={handleSend}
          disabled={loading}
          className="chatbox-send-btn"
        >
          {loading ? "发送中..." : "发送"}
        </button>
      </div>

      <div className="chatbox-footnote">
        {loadingMessages
          ? "正在同步最新聊天记录…"
          : selectedEmoticonId !== null
          ? "这次会把文字和已选表情包一起发出去。"
          : "草稿会自动记住，返回后不会丢字。"}
      </div>
    </div>
  );
}
