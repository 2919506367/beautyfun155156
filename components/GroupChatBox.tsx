"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChatSocket } from "@/hooks/useChatSocket";
import EmoticonPicker from "@/components/EmoticonPicker";

type ReplyTarget = {
  id: number;
  content: string;
  senderLabel: string;
};

type MentionUser = {
  id: number;
  nickname: string;
};

export default function GroupChatBox({
  groupId,
  onSent,
  loadingMessages = false,
  replyTarget,
  onCancelReply,
  mentionCandidates = [],
}: {
  groupId: number;
  onSent?: () => void | Promise<void>;
  loadingMessages?: boolean;
  replyTarget?: ReplyTarget | null;
  onCancelReply?: () => void;
  mentionCandidates?: MentionUser[];
}) {
  const { socket } = useChatSocket();

  const draftKey = useMemo(() => `beautyfun-group-draft-${groupId}`, [groupId]);

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [mentionText, setMentionText] = useState("");
  const [showMentionPanel, setShowMentionPanel] = useState(false);
  const [selectedEmoticonId, setSelectedEmoticonId] = useState<number | null>(null);
  const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);
  const typingHeartbeatRef = useRef<number | null>(null);
  const isFocusedRef = useRef(false);

  function reportTyping(isTyping: boolean) {
    socket.emit("group:typing", {
      groupId,
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

  function handleInput(next: string) {
    setContent(next);
    triggerTyping();

    const lastAt = next.lastIndexOf("@");
    if (lastAt >= 0) {
      const after = next.slice(lastAt + 1);
      if (!after.includes(" ") && !after.includes("\n")) {
        setShowMentionPanel(true);
        return;
      }
    }

    setShowMentionPanel(false);
  }

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      handleInput(`${content}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const next = `${content.slice(0, start)}${emoji}${content.slice(end)}`;
    handleInput(next);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextPosition = start + emoji.length;
      textarea.setSelectionRange(nextPosition, nextPosition);
    });
  }

  function applyMention(nickname: string) {
    const lastAt = content.lastIndexOf("@");
    if (lastAt < 0) return;

    const next = `${content.slice(0, lastAt)}@${nickname} `;
    setContent(next);
    setMentionText(nickname);
    setShowMentionPanel(false);
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
  }, [groupId]);

  async function handleSend() {
    const text = content.trim();
    if ((!text && selectedEmoticonId === null) || loading) return;

    setLoading(true);
    setNotice("");

    try {
      const res = await fetch("/api/groups/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          groupId,
          content: text,
          replyToId: replyTarget?.id ?? null,
          mentionText: mentionText || null,
          emoticonId: selectedEmoticonId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setNotice(data.error || "发送失败");
        return;
      }

      setContent("");
      setMentionText("");
      setSelectedEmoticonId(null);
      setShowEmoticonPicker(false);
      stopTypingPresence();

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
      handleSend();
    }
  }

  const mentionFiltered = mentionCandidates.filter((item) => {
    if (!showMentionPanel) return false;
    const lastAt = content.lastIndexOf("@");
    if (lastAt < 0) return false;
    const after = content.slice(lastAt + 1).trim().toLowerCase();
    if (!after) return true;
    return item.nickname.toLowerCase().includes(after);
  });

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

      {mentionText && (
        <div className="chatbox-mention-pill tg-composer-mention-pill">
          <span>当前提及：@{mentionText}</span>

          <button
            type="button"
            onClick={() => setMentionText("")}
            className="chatbox-inline-action-btn"
          >
            清除
          </button>
        </div>
      )}

      <div className="tg-composer-stage">
        {showEmoticonPicker && (
          <div className="tg-composer-picker-popover">
            <EmoticonPicker
              selectedId={selectedEmoticonId}
              onSelect={setSelectedEmoticonId}
              onEmojiSelect={insertEmoji}
              onClose={() => setShowEmoticonPicker(false)}
            />
          </div>
        )}

        {selectedEmoticonId && (
          <div className="tg-sticker-selected-strip">
            <span>已选择 1 个贴纸，会随本条群消息发送</span>
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
              onChange={(e) => handleInput(e.target.value)}
              onFocus={() => {
                startTypingPresence();
              }}
              onBlur={() => {
                stopTypingPresence();
              }}
              onKeyDown={handleKeyDown}
              placeholder={loadingMessages ? "正在同步最新群消息…" : "输入消息..."}
              rows={1}
              className="chatbox-textarea tg-composer-textarea"
            />

            {showMentionPanel && mentionFiltered.length > 0 && (
              <div className="chatbox-mention-panel tg-mention-panel">
                {mentionFiltered.slice(0, 8).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyMention(item.nickname)}
                    className="chatbox-mention-option"
                  >
                    @{item.nickname}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowEmoticonPicker((value) => !value)}
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
