import Link from "next/link";
import SiteLayout from "@/components/SiteLayout";
import ForumPostCard from "@/components/ForumPostCard";
import ForumSafeModeToggle from "@/components/ForumSafeModeToggle";
import ForumSearchBar from "@/components/ForumSearchBar";
import ForumRightSidebar from "@/components/ForumRightSidebar";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  q?: string;
  category?: string;
}>;

export default async function ForumPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const currentUser = await getCurrentUser();
  const params = await searchParams;

  const q = String(params.q || "").trim();
  const category = String(params.category || "").trim();

  const safeMode = currentUser
    ? await prisma.forumSafeMode.findUnique({
        where: { userId: currentUser.id },
      })
    : null;

  const safeModeEnabled = safeMode?.enabled ?? true;

  const posts = await prisma.forumPost.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [{ title: { contains: q } }, { content: { contains: q } }],
            }
          : {},
        category && category !== "全部" ? { category } : {},
      ],
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
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
      _count: {
        select: {
          comments: true,
        },
      },
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

  return (
    <SiteLayout title="论坛社区" active="forum" hidePageHead>
      <div className="forum-layout">
        <div className="forum-main">
          <div className="forum-hero-panel">
            <div className="forum-hero-chip-row">
              <span className="forum-hero-chip">Daily Underground</span>
              <span className="forum-hero-chip">社区情报流</span>
              <span className="forum-hero-chip">Liquid Glass Forum</span>
            </div>

            <h1 className="forum-hero-title">每日地下新闻</h1>

            <div className="forum-hero-subtitle">
              今日社区速览、热帖聚合与地下情报板。论坛列表、帖子详情、评论区现在开始统一进入 Liquid Glass 风格。
            </div>

            <div className="forum-hero-stats">
              <ForumMiniStat label="帖子总数" value={String(posts.length)} />
              <ForumMiniStat label="筛选分类" value={category || "全部"} />
              <ForumMiniStat label="搜索关键词" value={q || "未搜索"} />
            </div>
          </div>

          <div className="forum-toolbar-row">
            <ForumSearchBar initialQ={q} initialCategory={category || "全部"} />

            <div className="forum-toolbar-actions">
              <ForumSafeModeToggle initialEnabled={safeModeEnabled} />

              {currentUser?.role === "ADMIN" && (
                <>
                  <Link href="/forum/admin/create" className="forum-glass-btn forum-glass-btn-primary">
                    发布帖子
                  </Link>

                  <Link href="/forum/admin/manage" className="forum-glass-btn">
                    管理帖子
                  </Link>
                </>
              )}
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="forum-empty-panel">没有找到匹配的论坛帖子。</div>
          ) : (
            <div className="forum-post-list-panel">
              {posts.map((post) => (
                <ForumPostCard
                  key={post.id}
                  post={{
                    ...post,
                    createdAt: post.createdAt.toISOString(),
                  }}
                  blocked={post.ageRating === "AGE_16_PLUS" && safeModeEnabled}
                />
              ))}
            </div>
          )}
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

function ForumMiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="forum-mini-stat">
      <div className="forum-mini-stat-label">{label}</div>
      <div className="forum-mini-stat-value">{value}</div>
    </div>
  );
}