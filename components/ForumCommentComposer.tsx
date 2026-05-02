"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ForumCommentComposer({
  postId,
  mode,
  commentId,
  parentComment,
  initialContent = "",
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
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!content.trim()) {
      alert("内容不能为空");
      return;
    }

    setLoading(true);

    try {
      let url = "/api/forum/comment/create";
      let body: any = {
        postId,
        content,
      };

      if (mode === "reply") {
        url = "/api/forum/comment/reply-create";
        body = {
          postId,
          parentId: parentComment?.id,
          content,
        };
      }

      if (mode === "edit") {
        url = "/api/forum/comment/update";
        body = {
          commentId,
          content,
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
      onCancel?.();
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
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
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="forum-composer-card"
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

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="forum-composer-textarea"
      />

      <div className="forum-composer-actions">
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
          disabled={loading}
          whileHover={loading ? undefined : { y: -1.5, scale: 1.02 }}
          whileTap={loading ? undefined : { scale: 0.96 }}
          transition={{ duration: 0.18 }}
          className="forum-composer-submit-btn"
        >
          {loading ? "提交中..." : mode === "edit" ? "保存修改" : "提交"}
        </motion.button>
      </div>
    </motion.div>
  );
}