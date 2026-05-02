"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ForumCommentActions from "@/components/ForumCommentActions";
import ForumCommentComposer from "@/components/ForumCommentComposer";
import ForumCommentContent from "@/components/ForumCommentContent";
import UserIdentity from "@/components/UserIdentity";

type CommentNode = {
  id: number;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  isHidden: boolean;
  userId: number;
  user: {
    id: number;
    nickname: string;
    role: "BASIC" | "GOLD" | "ADMIN";
    xp: number;
  };
  likeCount: number;
  likedByMe: boolean;
  replies: CommentNode[];
};

export default function ForumCommentList({
  postId,
  currentUserId,
  isAdmin,
  comments,
}: {
  postId: number;
  currentUserId?: number;
  isAdmin: boolean;
  comments: CommentNode[];
}) {
  if (comments.length === 0) {
    return <div className="forum-comment-empty">还没有评论。</div>;
  }

  return (
    <div className="forum-comment-list">
      {comments.map((comment) => (
        <CommentNodeView
          key={comment.id}
          postId={postId}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          node={comment}
          depth={0}
        />
      ))}
    </div>
  );
}

function CommentNodeView({
  postId,
  currentUserId,
  isAdmin,
  node,
  depth,
}: {
  postId: number;
  currentUserId?: number;
  isAdmin: boolean;
  node: CommentNode;
  depth: number;
}) {
  const router = useRouter();
  const [replyOpen, setReplyOpen] = useState(false);
  const [moderating, setModerating] = useState(false);

  const canDelete = isAdmin || currentUserId === node.userId;

  async function handleModerate() {
    if (!isAdmin || moderating) return;
    setModerating(true);

    try {
      const res = await fetch("/api/forum/comment/moderate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commentId: node.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "审核失败");
        return;
      }

      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setModerating(false);
    }
  }

  return (
    <div
      className={`forum-comment-node ${depth > 0 ? "forum-comment-node-nested" : ""}`}
      style={{
        marginLeft: depth > 0 ? 18 : 0,
      }}
    >
      <div className="forum-comment-card-glass">
        <div className="forum-comment-head-glass">
          <UserIdentity
            userId={node.user.id}
            nickname={node.user.nickname}
            role={node.user.role}
            xp={node.user.xp}
          />

          <div className="forum-comment-time">
            {new Date(node.createdAt).toLocaleString()}
          </div>
        </div>

        <ForumCommentContent
          content={node.content}
          isHidden={node.isHidden}
          editedAt={node.editedAt || null}
        />

        {currentUserId && (
          <ForumCommentActions
            commentId={node.id}
            postId={postId}
            initiallyLiked={node.likedByMe}
            initialLikeCount={node.likeCount}
            canDelete={canDelete}
            onReply={() => setReplyOpen((v) => !v)}
          />
        )}

        {isAdmin && (
          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              onClick={handleModerate}
              className="forum-comment-admin-btn"
            >
              {moderating ? "处理中..." : node.isHidden ? "恢复显示" : "屏蔽评论"}
            </button>
          </div>
        )}

        {replyOpen && currentUserId && (
          <div style={{ marginTop: 14 }}>
            <ForumCommentComposer
              postId={postId}
              mode="reply"
              parentComment={{
                id: node.id,
                nickname: node.user.nickname,
                content: node.content,
              }}
              onCancel={() => setReplyOpen(false)}
            />
          </div>
        )}
      </div>

      {node.replies.length > 0 && (
        <div className="forum-comment-replies">
          {node.replies.map((reply) => (
            <CommentNodeView
              key={reply.id}
              postId={postId}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              node={reply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}