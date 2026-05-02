"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import EmoticonPicker from "@/components/EmoticonPicker";

export default function ForumCommentComposer({
  postId,
  mode,
  commentId,
  parentComment,
  initialContent = "",
  initialEmoticonId = null,
  onCancel,
}: {
  postId: number;
  mode: "create" | "reply" | "edit";
  commentId?: number;
  parentComment?: {
    id: number;
    nickname: string;
    content: string;
  } | null;
  initialContent?: string;
  initialEmoticonId?: number | null;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const pickerButtonRef = useRef<HTMLButtonElement | null>(null);
  const [content, setContent] = useState(initialContent);
  const [selectedEmoticonId, setSelectedEmoticonId] = useState<number | null>(initialEmoticonId);
  const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);
  const [pickerRect, setPickerRect] = useState<{
    left: number;
    top: number;
    width: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!showEmoticonPicker) return;

    function updatePickerPosition() {
      const button = pickerButtonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const pickerWidth = Math.min(560, Math.max(320, window.innerWidth - 32));
      const left = Math.min(
        Math.max(16, rect.left),
        Math.max(16, window.innerWidth - pickerWidth - 16)
      );

      const preferredTop = rect.top - 396;
      const fallbackTop = rect.bottom + 12;
      const top = preferredTop >= 16 ? preferredTop : fallbackTop;

      setPickerRect({
        left,
        top,
        width: pickerWidth,
      });
    }

    updatePickerPosition();

    window.addEventListener("resize", updatePickerPosition);
    window.addEventListener("scroll", updatePickerPosition, true);

    return () => {
      window.removeEventListener("resize", updatePickerPosition);
      window.removeEventListener("scroll", updatePickerPosition, true);
    };
  }, [showEmoticonPicker]);

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

    if (!text && selectedEmoticonId === null) {
      alert("内容和表情包不能同时为空");
      return;
    }

    setLoading(true);

    try {
      let url = "/api/forum/comment/create";
      let body: any = {
        postId,
        content: text,
        emoticonId: selectedEmoticonId,
      };

      if (mode === "reply") {
        url = "/api/forum/comment/reply-create";
        body = {
          postId,
          parentId: parentComment?.id,
          content: text,
          emoticonId: selectedEmoticonId,
        };
      }

      if (mode === "edit") {
        url = "/api/forum/comment/update";
        body = {
          commentId,
          content: text,
          emoticonId: selectedEmoticonId,
        };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "提交失败");
        return;
      }

      setContent("");
      setSelectedEmoticonId(null);
      setShowEmoticonPicker(false);
      onCancel?.();
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
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

  const title =
    mode === "edit" ? "编辑评论" : mode === "reply" ? "回复评论" : "参与讨论";

  const placeholder =
    mode === "edit"
      ? "修改评论内容..."
      : mode === "reply"
      ? "写下你的回复..."
      : "写下你的评论...";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.99 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="forum-composer-card"
        style={{ position: "relative", overflow: "visible" }}
      >
        <div className="forum-composer-title">{title}</div>

        <AnimatePresence>
          {parentComment && mode === "reply" && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="forum-composer-quote"
            >
              <div className="forum-composer-quote-title">
                回复 @{parentComment.nickname}
              </div>
              <div className="forum-composer-quote-content">
                {parentComment.content}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ position: "relative", overflow: "visible" }}>
          {selectedEmoticonId !== null && (
            <div className="tg-sticker-selected-strip comment-sticker-selected-strip" style={{ marginBottom: 10 }}>
              <span>已选择 1 个贴纸，会随本条评论发送</span>
              <button type="button" onClick={() => setSelectedEmoticonId(null)}>
                移除
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="forum-composer-textarea"
            style={{ minHeight: 136 }}
          />
        </div>

        <div className="forum-composer-actions" style={{ alignItems: "center" }}>
          <button
            ref={pickerButtonRef}
            type="button"
            onClick={() => setShowEmoticonPicker((value) => !value)}
            className="forum-composer-cancel-btn"
            style={{ marginRight: "auto" }}
          >
            {showEmoticonPicker ? "关闭表情" : "表情 / 贴纸"}
          </button>

          {onCancel && (
            <motion.button
              type="button"
              onClick={onCancel}
              whileHover={{ y: -1.5, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="forum-composer-cancel-btn"
            >
              取消
            </motion.button>
          )}

          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={loading || (!content.trim() && selectedEmoticonId === null)}
            whileHover={loading ? undefined : { y: -1.5, scale: 1.02 }}
            whileTap={loading ? undefined : { scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="forum-composer-submit-btn"
          >
            {loading ? "提交中..." : mode === "edit" ? "保存修改" : "提交"}
          </motion.button>
        </div>
      </motion.div>

      {mounted &&
        showEmoticonPicker &&
        pickerRect &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="关闭表情面板"
              onClick={() => setShowEmoticonPicker(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 2147483600,
                border: 0,
                background: "transparent",
                cursor: "default",
              }}
            />

            <div
              className="comment-telegram-composer"
              style={{
                position: "fixed",
                left: pickerRect.left,
                top: pickerRect.top,
                width: pickerRect.width,
                maxHeight: "min(420px, calc(100dvh - 32px))",
                margin: 0,
                padding: 0,
                border: 0,
                borderRadius: 18,
                background: "transparent",
                boxShadow: "0 28px 88px rgba(0,0,0,0.38)",
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
                overflow: "visible",
                zIndex: 2147483601,
              }}
            >
              <EmoticonPicker
                selectedId={selectedEmoticonId}
                onSelect={setSelectedEmoticonId}
                onEmojiSelect={insertEmoji}
                onClose={() => setShowEmoticonPicker(false)}
              />
            </div>
          </>,
          document.body
        )}
    </>
  );
}
