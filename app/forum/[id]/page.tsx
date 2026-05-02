import { notFound } from "next/navigation";
import SiteLayout from "@/components/SiteLayout";
import ForumMediaBlock from "@/components/ForumMediaBlock";
import ForumCommentForm from "@/components/ForumCommentForm";
import ForumCommentList from "@/components/ForumCommentList";
import ForumSafeReveal from "@/components/ForumSafeReveal";
import ForumCommentSortBar from "@/components/ForumCommentSortBar";
import ForumRightSidebar from "@/components/ForumRightSidebar";
import UserIdentity from "@/components/UserIdentity";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = Promise<{
  id: string;
}>;

type SearchParams = Promise<{
  commentSort?: string;
}>;

export default async function ForumPostDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const postId = Number(id);
  const commentSort = sp.commentSort === "hot" ? "hot" : "latest";

  if (!postId || Number.isNaN(postId)) {
    notFound();
  }

  const currentUser = await getCurrentUser();

  const safeMode = currentUser
    ? await prisma.forumSafeMode.findUnique({
        where: { userId: currentUser.id },
      })
    : null;

  const safeModeEnabled = safeMode?.enabled ?? true;

  const post = await prisma.forumPost.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          nickname: true,
          role: true,
          xp: true,
        },
      },
      mediaItems: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const allComments = await prisma.forumComment.findMany({
    where: {
      postId,
    },
    include: {
      user: {
        select: {
          id: true,
          nickname: true,
          role: true,
          xp: true,
        },
      },
      likes: true,
    },
  });

  const privateChats = currentUser
    ? await prisma.user.findMany({
        where: {
          id: {
            not: currentUser.id,
          },
        },
        select: {
          id: true,
          nickname: true,
          account: true,
        },
        take: 6,
      })
    : [];

  const groups: { id: number; name: string; memberCount: number }[] = [];
  const blocked = post.ageRating === "AGE_16_PLUS" && safeModeEnabled;

  const nodeMap = new Map<number, any>();

  for (const comment of allComments) {
    nodeMap.set(comment.id, {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      editedAt: comment.editedAt ? comment.editedAt.toISOString() : null,
      isHidden: comment.isHidden,
      userId: comment.userId,
      user: comment.user,
      likeCount: comment.likes.length,
      likedByMe: currentUser
        ? comment.likes.some((like) => like.userId === currentUser.id)
        : false,
      parentId: comment.parentId,
      replies: [],
    });
  }

  const roots: any[] = [];

  for (const comment of allComments) {
    const node = nodeMap.get(comment.id);

    if (comment.parentId && nodeMap.has(comment.parentId)) {
      nodeMap.get(comment.parentId).replies.push(node);
    } else {
      roots.push(node);
    }
  }

  function sortNodes(nodes: any[]): any[] {
    const sorted = [...nodes].sort((a, b) => {
      if (commentSort === "hot") {
        if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return sorted.map((node) => ({
      ...node,
      replies: sortNodes(node.replies),
    }));
  }

  const commentTree = sortNodes(roots);

  return (
    <SiteLayout title="论坛帖子详情" active="forum" hidePageHead>
      <div className="forum-layout forum-detail-layout">
        <div className="forum-main">
          <div className="forum-detail-hero">
            <div className="forum-detail-chip-row">
              {post.isPinned && <span className="forum-detail-chip forum-detail-chip-warm">置顶</span>}
              <span className="forum-detail-chip forum-detail-chip-indigo">{post.category}</span>
              <span
                className={`forum-detail-chip ${
                  post.ageRating === "AGE_16_PLUS"
                    ? "forum-detail-chip-danger"
                    : "forum-detail-chip-safe"
                }`}
              >
                {post.ageRating === "AGE_16_PLUS" ? "16+" : "全年龄"}
              </span>
              <span className="forum-detail-chip">媒体 {post.mediaItems.length}</span>
            </div>

            <h1 className="forum-detail-title">{post.title}</h1>

            <div className="forum-detail-meta">
              <span>由</span>

              <UserIdentity
                userId={post.author.id}
                nickname={post.author.nickname}
                role={post.author.role}
                xp={post.author.xp}
              />

              <span>发布</span>
              <span>／</span>
              <span>{new Date(post.createdAt).toLocaleString()}</span>
            </div>

            <ForumSafeReveal
              blocked={blocked}
              message="当前帖子正文受限制。你可以仅查看这条内容，或者关闭论坛安全模式后持续浏览。"
            >
              <div className="forum-detail-content">{post.content}</div>
            </ForumSafeReveal>

            <div style={{ marginTop: 18 }}>
              <ForumMediaBlock items={post.mediaItems} blocked={blocked} />
            </div>
          </div>

          {currentUser ? (
            <div className="forum-comment-form-panel">
              <ForumCommentForm postId={post.id} />
            </div>
          ) : (
            <div className="forum-empty-panel">请先登录后再发表评论。</div>
          )}

          <div className="forum-comment-panel">
            <div className="forum-comment-panel-head">
              <div className="forum-comment-panel-title">评论区</div>
              <div className="forum-comment-panel-count">共 {allComments.length} 条评论</div>
            </div>

            <ForumCommentSortBar sort={commentSort} />

            <ForumCommentList
              postId={post.id}
              currentUserId={currentUser?.id}
              isAdmin={currentUser?.role === "ADMIN"}
              comments={commentTree}
            />
          </div>
        </div>

        <div className="forum-side">
          <ForumRightSidebar
            privateChats={privateChats.map((item) => ({
              userId: item.id,
              nickname: item.nickname,
              account: item.account,
            }))}
            groups={groups}
          />
        </div>
      </div>
    </SiteLayout>
  );
}