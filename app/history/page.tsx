import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WorkCardLite from "@/components/WorkCardLite";
import PaginationBar from "@/components/PaginationBar";
import SiteLayout from "@/components/SiteLayout";
import Link from "next/link";

const PAGE_SIZE = 48;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const currentPage = Math.max(1, Number(params.page || "1") || 1);

  if (!user) {
    return (
      <SiteLayout title="观看历史" active="history" hidePageHead>
        <div className="bf-page-shell">
          <section className="bf-section-hero">
            <div className="bf-section-hero-inner">
              <div>
                <div className="bf-hero-kicker-row">
                  <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> History</span>
                </div>
                <h1 className="bf-hero-title-xl">观看历史</h1>
                <p className="bf-hero-subtitle-lg">请先登录后查看历史记录。</p>
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

  const totalCount = await prisma.viewHistory.count({ where: { userId: user.id } });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const histories = await prisma.viewHistory.findMany({
    where: { userId: user.id },
    orderBy: { viewedAt: "desc" },
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
    <SiteLayout title="观看历史" active="history" hidePageHead>
      <div className="bf-page-shell">
        <section className="bf-section-hero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Watch Timeline</span>
                <span className="bf-hero-kicker">最近浏览</span>
              </div>
              <h1 className="bf-hero-title-xl">观看历史</h1>
              <p className="bf-hero-subtitle-lg">
                记录你打开过的作品，方便从上次的灵感位置继续看。新版历史页统一为高级玻璃网格，并保留原来的访问权限判断。
              </p>
            </div>
            <aside className="bf-hero-side-card">
              <div className="bf-stats-grid" style={{ gridTemplateColumns: "1fr" }}>
                <MiniStat label="历史总数" value={String(totalCount)} />
                <MiniStat label="当前页" value={`${currentPage} / ${totalPages}`} />
                <MiniStat label="账号" value={user.nickname} />
              </div>
            </aside>
          </div>
        </section>

        <section className="bf-page-panel">
          <div className="bf-panel-head">
            <div>
              <h2 className="bf-panel-title">最近浏览</h2>
              <div className="bf-panel-subtitle">按最近浏览时间倒序排列。</div>
            </div>
            <PaginationBar basePath="/history" currentPage={currentPage} totalPages={totalPages} />
          </div>

          {histories.length === 0 ? (
            <div className="bf-empty-state">还没有观看历史</div>
          ) : (
            <div className="bf-responsive-grid works-grid">
              {histories.map((item) => {
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
                    timeLabel="浏览时间"
                    timeValue={new Date(item.viewedAt).toLocaleString()}
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
            <PaginationBar basePath="/history" currentPage={currentPage} totalPages={totalPages} />
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
