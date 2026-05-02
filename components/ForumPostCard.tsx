import Link from "next/link";
import UserIdentity from "@/components/UserIdentity";
import ForumMediaBlock from "@/components/ForumMediaBlock";
import ForumSafeReveal from "@/components/ForumSafeReveal";

type ForumPostCardPost = {
  id: number;
  title?: string | null;
  content?: string | null;
  coverUrl?: string | null;
  mediaCount?: number | null;
  category?: string | null;
  ageRating: "ALL_AGES" | "AGE_16_PLUS";
  isPinned: boolean;
  createdAt: string;
  author: {
    id: number;
    nickname: string;
    role: "BASIC" | "GOLD" | "ADMIN";
    xp: number;
  };
  mediaItems: {
    id: number;
    type: "IMAGE" | "VIDEO" | "JPEG_SEQUENCE";
    url: string;
  }[];
  _count?: {
    comments: number;
  };
};

export default function ForumPostCard({
  post,
  blocked,
}: {
  post: ForumPostCardPost;
  blocked: boolean;
}) {
  const safeTitle = String(post?.title || "无标题帖子");
  const safeContent = String(post?.content || "");
  const safeCategory = String(post?.category || "未分类");

  const previewText =
    safeContent.length > 110 ? `${safeContent.slice(0, 110)}...` : safeContent;

  const previewMedia = post?.mediaItems?.[0] ? [post.mediaItems[0]] : [];

  return (
    <Link href={`/forum/${post.id}`} className="forum-post-card">
      <div className="forum-post-card-chip-row">
        {post.isPinned && (
          <span className="forum-post-chip forum-post-chip-warm">置顶</span>
        )}
        <span className="forum-post-chip forum-post-chip-indigo">
          {safeCategory}
        </span>
        <span
          className={`forum-post-chip ${
            post.ageRating === "AGE_16_PLUS"
              ? "forum-post-chip-danger"
              : "forum-post-chip-safe"
          }`}
        >
          {post.ageRating === "AGE_16_PLUS" ? "16+" : "全年龄"}
        </span>
        {post.mediaCount ? (
          <span className="forum-post-chip">媒体 {post.mediaCount}</span>
        ) : null}
      </div>

      <div className="forum-post-card-title">{safeTitle}</div>

      <div className="forum-post-card-meta">
        <UserIdentity
          userId={post.author.id}
          nickname={post.author.nickname}
          role={post.author.role}
          xp={post.author.xp}
          linkToProfile={false}
        />
        <span>·</span>
        <span>{new Date(post.createdAt).toLocaleString()}</span>
      </div>

      <ForumSafeReveal
        blocked={blocked}
        message="该帖子正文受限制。你可以仅查看这条内容，或者关闭论坛安全模式后持续浏览。"
      >
        <div className="forum-post-card-preview">
          {previewText || "暂无正文预览"}
        </div>
      </ForumSafeReveal>

      {previewMedia.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <ForumMediaBlock items={previewMedia} blocked={blocked} compact />
        </div>
      )}

      <div className="forum-post-card-footer">
        <span>💬 {post._count?.comments || 0}</span>
        <span>查看详情</span>
      </div>
    </Link>
  );
}