"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import InlineActionNotice from "@/components/InlineActionNotice";
import EmoticonPicker from "@/components/EmoticonPicker";

export default function CommentForm({ workId }: { workId: number }) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"error" | "warning" | "success">("error");
  const [emoticonId, setEmoticonId] = useState<number | null>(null);
  const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;

    if (!textarea) {
      setContent((current) => `${current}${emoji}`);
      return;
    }

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const next = `${content.slice(0, start)}${emoji}${content.slice(end)}`;

    setContent(next);

    window.requestAnimationFrame(() => {
      textarea.focus();
      const nextPosition = start + emoji.length;
      textarea.setSelectionRange(nextPosition, nextPosition);
    });
  }

  async function handleSubmit() {
    const text = content.trim();

    if (!text && emoticonId === null) {
      setNoticeType("warning");
      setNotice("评论内容和表情包不能同时为空");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const res = await fetch("/api/comment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          workId,
          content: text,
          emoticonId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "评论失败";
        setNoticeType(message.includes("禁言") ? "warning" : "error");
        setNotice(message);
        return;
      }

      setContent("");
      setEmoticonId(null);
      setShowEmoticonPicker(false);
      setNoticeType("success");
      setNotice("评论成功");
      router.refresh();
    } catch {
      setNoticeType("error");
      setNotice("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="comment-telegram-composer">
      <div className="comment-telegram-head">
        <div>
          <div className="comment-telegram-title">发表评论</div>
          <div className="comment-telegram-subtitle">支持 Emoji、贴纸表情包；Ctrl + Enter 快速发送</div>
        </div>
      </div>

      {notice && (
        <div className="comment-telegram-notice-wrap">
          <InlineActionNotice message={notice} type={noticeType} />
        </div>
      )}

      <div className="comment-telegram-stage">
        {showEmoticonPicker && (
          <FloatingCommentEmoticonPicker
            selectedId={emoticonId}
            onSelect={setEmoticonId}
            onEmojiSelect={insertEmoji}
            onClose={() => setShowEmoticonPicker(false)}
          />
        )}

        {emoticonId !== null && (
          <div className="tg-sticker-selected-strip comment-sticker-selected-strip">
            <span>已选择 1 个贴纸，会随本条评论发送</span>
            <button type="button" onClick={() => setEmoticonId(null)}>
              移除
            </button>
          </div>
        )}

        <div className="comment-telegram-bar">
          <button type="button" className="tg-composer-circle-btn comment-composer-circle-btn" aria-label="附件占位">
            📎
          </button>

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="写下你的评论..."
            rows={2}
            className="comment-telegram-textarea"
          />

          <button
            type="button"
            onClick={() => setShowEmoticonPicker((value) => !value)}
            className={`tg-composer-circle-btn comment-composer-circle-btn ${showEmoticonPicker ? "tg-composer-circle-btn-active" : ""}`}
            aria-label="表情和贴纸"
          >
            ☺
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && emoticonId === null)}
            className="chatbox-send-btn tg-composer-send-btn comment-composer-send-btn"
          >
            {loading ? "…" : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FloatingCommentEmoticonPicker({
  selectedId,
  onSelect,
  onEmojiSelect,
  onClose,
}: {
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: "fixed",
        left: "50%",
        bottom: 104,
        width: "min(520px, calc(100vw - 32px))",
        transform: "translateX(-50%)",
        zIndex: 2147483646,
      }}
    >
      <div
        className="comment-telegram-composer"
        style={{
          margin: 0,
          padding: 0,
          border: 0,
          borderRadius: 16,
          background: "transparent",
          boxShadow: "0 26px 72px rgba(0,0,0,0.34)",
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
          overflow: "visible",
        }}
      >
        <EmoticonPicker
          selectedId={selectedId}
          onSelect={onSelect}
          onEmojiSelect={onEmojiSelect}
          onClose={onClose}
        />
      </div>
    </div>,
    document.body
  );
}
