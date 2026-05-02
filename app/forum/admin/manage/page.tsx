import { redirect } from "next/navigation";
import Link from "next/link";
import SiteLayout from "@/components/SiteLayout";
import ForumAdminPostActions from "@/components/ForumAdminPostActions";
import ForumPinToggleButton from "@/components/ForumPinToggleButton";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ForumManagePage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) redirect("/login");
  if (currentUser.role !== "ADMIN") redirect("/forum");

  const posts = await prisma.forumPost.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { nickname: true } },
      _count: { select: { comments: true, mediaItems: true } },
    },
  });

  return (
    <SiteLayout title="论坛帖子管理" active="forum" hidePageHead>
      <div className="cel-admin-shell">
        <section className="cel-cinema-panel cel-hero-strip">
          <div>
            <div className="cel-eyebrow">Forum Console · Daily Underground News</div>
            <h1 className="cel-title-xl">Post Control</h1>
            <p className="cel-subtitle">
              管理置顶、编辑和删除论坛帖子。内容区改成 Celestia 黑白情报板，功能按钮仍然调用原来的组件。
            </p>
          </div>
        </section>

        <section className="cel-cinema-panel" style={{ padding: 24 }}>
          <div className="cel-stat-grid" style={{ marginBottom: 18 }}>
            <StatCard label="帖子总数" value={posts.length} />
            <StatCard label="置顶帖子" value={posts.filter((p) => p.isPinned).length} />
            <StatCard label="媒体总数" value={posts.reduce((sum, p) => sum + p._count.mediaItems, 0)} />
            <StatCard label="评论总数" value={posts.reduce((sum, p) => sum + p._count.comments, 0)} />
          </div>

          {posts.length === 0 ? (
            <div className="cel-list-card cel-muted">还没有论坛帖子。</div>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {posts.map((post) => (
                <article key={post.id} className="cel-list-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ minWidth: 0, flex: "1 1 360px" }}>
                      <div className="cel-pill-row" style={{ marginBottom: 10 }}>
                        {post.isPinned && <span className="cel-pill cel-pill-gold">置顶</span>}
                        <span className="cel-pill">{post.category}</span>
                        <span className={post.ageRating === "AGE_16_PLUS" ? "cel-pill cel-pill-danger" : "cel-pill"}>
                          {post.ageRating === "AGE_16_PLUS" ? "16+" : "全年龄"}
                        </span>
                        <span className="cel-pill">媒体 {post._count.mediaItems}</span>
                        <span className="cel-pill">评论 {post._count.comments}</span>
                      </div>

                      <h2 className="cel-title-md" style={{ fontSize: 28 }}>{post.title}</h2>
                      <div className="cel-meta" style={{ marginTop: 8 }}>
                        作者：{post.author.nickname}　/　{new Date(post.createdAt).toLocaleString()}
                      </div>
                      <p className="cel-subtitle" style={{ marginTop: 10 }}>
                        {post.content.slice(0, 140)}{post.content.length > 140 ? "..." : ""}
                      </p>
                    </div>

                    <div className="cel-action-row" style={{ justifyContent: "flex-end" }}>
                      <Link href={`/forum/${post.id}`} className="cel-button-light">查看</Link>
                      <Link href={`/forum/admin/edit/${post.id}`} className="cel-button-light">编辑</Link>
                      <ForumPinToggleButton postId={post.id} pinned={post.isPinned} />
                      <ForumAdminPostActions postId={post.id} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="cel-stat-card">
      <div className="cel-stat-label">{label}</div>
      <div className="cel-stat-num">{value}</div>
    </div>
  );
}
