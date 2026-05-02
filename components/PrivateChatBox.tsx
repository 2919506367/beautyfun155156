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
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const typingHeartbeatRef = useRef<number | null>(null);
  const isFocusedRef = useRef(false);

  function reportTyping(isTyping: boolean) {
    socket.emit("private:typing", { targetUserId, isTyping });
  }

  function clearTypingTimers() {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    if (typingHeartbeatRef.current) window.clearInterval(typingHeartbeatRef.current);
    typingTimerRef.current = null;
    typingHeartbeatRef.current = null;
  }

  function startTypingPresence() {
    isFocusedRef.current = true;
    reportTyping(true);
    if (typingHeartbeatRef.current) window.clearInterval(typingHeartbeatRef.current);
    typingHeartbeatRef.current = window.setInterval(() => {
      if (isFocusedRef.current) reportTyping(true);
    }, 1800);
  }

  function stopTypingPresence() {
    isFocusedRef.current = false;
    clearTypingTimers();
    reportTyping(false);
  }

  function triggerTyping() {
    reportTyping(true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      if (!isFocusedRef.current) reportTyping(false);
      typingTimerRef.current = null;
    }, 2600);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw !== null) setContent(raw);
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
        headers: { "Content-Type": "application/json" },
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
      if (onSent) await onSent();
    } catch {
      setNotice("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="chatbox-shell tg-composer-shell">
      {replyTarget && (
        <div className="chatbox-reply-card tg-composer-reply">
          <div className="chatbox-reply-head">
            <div className="chatbox-reply-title">回复 {replyTarget.senderLabel}</div>
            <button
              type="button"
              onClick={onCancelReply}
              className="chatbox-inline-action-btn"
            >
              取消
            </button>
          </div>
          <div className="chatbox-reply-content">{replyTarget.content}</div>
        </div>
      )}

      {notice && <div className="chatbox-notice chatbox-notice-error">{notice}</div>}

      <div className="tg-composer-stage">
        {showEmoticonPicker && (
          <div className="tg-composer-picker-popover">
            <EmoticonPicker
              selectedId={selectedEmoticonId}
              onSelect={setSelectedEmoticonId}
              onEmojiSelect={(emoji) => {
                const textarea = textareaRef.current;
                if (!textarea) {
                  setContent(content + emoji);
                  return;
                }
                const start = textarea.selectionStart ?? content.length;
                const end = textarea.selectionEnd ?? content.length;
                const next = `${content.slice(0, start)}${emoji}${content.slice(end)}`;
                setContent(next);
                window.requestAnimationFrame(() => {
                  textarea.focus();
                  textarea.setSelectionRange(start + emoji.length, start + emoji.length);
                });
                triggerTyping();
              }}
              onClose={() => setShowEmoticonPicker(false)}
            />
          </div>
        )}

        {selectedEmoticonId && (
          <div className="tg-sticker-selected-strip">
            <span>已选择 1 个贴纸，会随本条私聊消息发送</span>
            <button type="button" onClick={() => setSelectedEmoticonId(null)}>
              移除
            </button>
          </div>
        )}

        <div className="tg-composer-bar">
          <button type="button" className="tg-composer-circle-btn" aria-label="附件">
            📎
          </button>

          <div className="tg-composer-input-wrap">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={startTypingPresence}
              onBlur={stopTypingPresence}
              onKeyDown={handleKeyDown}
              placeholder={loadingMessages ? "正在同步最新私聊…" : "输入消息..."}
              rows={1}
              className="chatbox-textarea tg-composer-textarea"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowEmoticonPicker((prev) => !prev)}
            className={`tg-composer-circle-btn ${showEmoticonPicker ? "tg-composer-circle-btn-active" : ""}`}
            aria-label="表情和贴纸"
          >
            ☺
          </button>

          <button type="button" className="tg-composer-circle-btn tg-composer-mic" aria-label="语音占位">
            🎙
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={loading || (!content.trim() && selectedEmoticonId === null)}
            className="chatbox-send-btn tg-composer-send-btn"
          >
            {loading ? "…" : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
}