import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorkCardLite from "@/components/WorkCardLite";
import PaginationBar from "@/components/PaginationBar";
import SiteLayout from "@/components/SiteLayout";
import Link from "next/link";

const PAGE_SIZE = 48;

export default async function FavoritesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page || "1") || 1);

  if (!user) {
    return (
      <SiteLayout title="我的收藏" active="favorites" hidePageHead>
        <div className="bf-page-shell">
          <section className="bf-section-hero">
            <div className="bf-section-hero-inner">
              <div>
                <div className="bf-hero-kicker-row">
                  <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Favorites</span>
                </div>
                <h1 className="bf-hero-title-xl">我的收藏</h1>
                <p className="bf-hero-subtitle-lg">请先登录后查看你的收藏作品。</p>
              </div>
              <div className="bf-hero-side-card">
                <Link href="/login" className="bf-primary-link">去登录</Link>
              </div>
            </div>
          </section>
        </div>
      </SiteLayout>
    );
  }

  const isAdmin = user.role === "ADMIN";
  const favoriteWhere = {
    userId: user.id,
    ...(!isAdmin ? { work: { isPublic: true } } : {}),
  };

  const totalCount = await prisma.favorite.count({
    where: favoriteWhere,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const favorites = await prisma.favorite.findMany({
    where: favoriteWhere,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      work: {
        include: {
          author: true,
          files: { orderBy: { sortOrder: "asc" } },
          _count: { select: { files: true } },
        },
      },
    },
  });

  return (
    <SiteLayout title="我的收藏" active="favorites" hidePageHead>
      <div className="bf-page-shell">
        <section className="bf-section-hero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Favorites Library</span>
                <span className="bf-hero-kicker">私人收藏夹</span>
              </div>
              <h1 className="bf-hero-title-xl">我的收藏</h1>
              <p className="bf-hero-subtitle-lg">
                把喜欢的图集、动图和视频集中在这里。新版收藏页强化了空状态、分页位置和卡片网格，让回看更顺手。
              </p>
            </div>
            <aside className="bf-hero-side-card">
              <div className="bf-stats-grid" style={{ gridTemplateColumns: "1fr" }}>
                <MiniStat label="收藏总数" value={String(totalCount)} />
                <MiniStat label="当前页" value={`${currentPage} / ${totalPages}`} />
                <MiniStat label="账号" value={user.nickname} />
              </div>
            </aside>
          </div>
        </section>

        <section className="bf-page-panel">
          <div className="bf-panel-head">
            <div>
              <h2 className="bf-panel-title">收藏作品</h2>
              <div className="bf-panel-subtitle">按收藏时间倒序排列，原有权限锁定和跳转逻辑不变。</div>
            </div>
            <PaginationBar basePath="/favorites" currentPage={currentPage} totalPages={totalPages} />
          </div>

          {favorites.length === 0 ? (
            <div className="bf-empty-state">还没有收藏作品</div>
          ) : (
            <div className="bf-responsive-grid works-grid">
              {favorites.map((item) => {
                const work = item.work;
                const cover = work.coverUrl || work.files[0]?.fileUrl || "";
                const accessMode =
                  work.viewCount >= 99 && user.role === "BASIC" ? "hot_locked" : "allow";

                return (
                  <WorkCardLite
                    key={item.id}
                    href={`/works/${work.id}`}
                    title={work.title}
                    type={work.type}
                    authorId={work.author.id}
                    authorName={work.author.nickname}
                    authorRole={work.author.role}
                    authorXp={work.author.xp}
                    pageCount={work._count.files}
                    timeLabel="收藏时间"
                    timeValue={new Date(item.createdAt).toLocaleString()}
                    cover={cover}
                    viewCount={work.viewCount}
                    tags={work.tags || ""}
                    ageRating={work.ageRating}
                    accessMode={accessMode}
                  />
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 22 }}>
            <PaginationBar basePath="/favorites" currentPage={currentPage} totalPages={totalPages} />
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bf-stat-card">
      <div className="bf-stat-label">{label}</div>
      <div className="bf-stat-value">{value}</div>
    </div>
  );
}
