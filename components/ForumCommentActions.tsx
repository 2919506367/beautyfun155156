"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ForumCommentActions({
  commentId,
  postId,
  initiallyLiked,
  initialLikeCount,
  canDelete,
  onReply,
}: {
  commentId: number;
  postId: number;
  initiallyLiked: boolean;
  initialLikeCount: number;
  canDelete: boolean;
  onReply: () => void;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initiallyLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [loading, setLoading] = useState(false);

  async function handleToggleLike() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("/api/forum/comment/toggle-like", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "点赞失败");
        return;
      }

      setLiked(data.liked);
      setLikeCount((prev) => prev + (data.liked ? 1 : -1));
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    const ok = window.confirm("确定删除这条评论吗？");
    if (!ok) return;

    try {
      const res = await fetch("/api/forum/comment/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ commentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "删除失败");
        return;
      }

      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    }
  }

  return (
    <div className="forum-comment-actions-row">
      <ActionButton
        onClick={handleToggleLike}
        className={liked ? "forum-comment-action-btn-liked" : ""}
      >
        {liked ? "已赞" : "点赞"} · {likeCount}
      </ActionButton>

      <ActionButton onClick={onReply}>回复</ActionButton>

      {canDelete && (
        <ActionButton
          onClick={handleDelete}
          className="forum-comment-action-btn-danger"
        >
          删除
        </ActionButton>
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1.5, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className={`forum-comment-action-btn ${className}`.trim()}
    >
      {children}
    </motion.button>
  );
}