"use client";

import ForumCommentComposer from "@/components/ForumCommentComposer";

export default function ForumCommentForm({
  postId,
  parentComment,
  onCancelReply,
}: {
  postId: number;
  parentComment?: {
    id: number;
    nickname: string;
    content: string;
  } | null;
  onCancelReply?: () => void;
}) {
  return (
    <ForumCommentComposer
      postId={postId}
      mode={parentComment ? "reply" : "create"}
      parentComment={parentComment}
      onCancel={onCancelReply}
    />
  );
}