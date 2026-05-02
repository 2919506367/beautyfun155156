import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SiteLayout from "@/components/SiteLayout";
import AdminDeleteWorkInlineButton from "@/components/AdminDeleteWorkInlineButton";
import VideoFrameCover from "@/components/VideoFrameCover";

const PAGE_SIZE = 30;

function getWorkTypeLabel(type: "FOLDER" | "GIF" | "VIDEO") {
  if (type === "FOLDER") return "图集";
  if (type === "GIF") return "动图（帧序列）";
  return "视频";
}

export default async function AdminWorksPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    keyword?: string;
    type?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    return (
      <SiteLayout title="管理员作品管理" active="admin">
        <EmptyState title="请先登录" description="登录管理员账号后才能进入作品控制台。" />
      </SiteLayout>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <SiteLayout title="管理员作品管理" active="upload">
        <EmptyState title="权限不足" description="只有管理员可以访问这个页面。" />
      </SiteLayout>
    );
  }

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const keyword = String(params.keyword || "").trim();
  const type = String(params.type || "").trim();

  const where = {
    ...(keyword ? { title: { contains: keyword } } : {}),
    ...(type && ["FOLDER", "GIF", "VIDEO"].includes(type)
      ? { type: type as "FOLDER" | "GIF" | "VIDEO" }
      : {}),
  };

  const totalCount = await prisma.work.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const works = await prisma.work.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      author: true,
      files: { orderBy: { sortOrder: "asc" } },
    },
  });

  function buildPageHref(page: number) {
    const usp = new URLSearchParams();
    if (keyword) usp.set("keyword", keyword);
    if (type) usp.set("type", type);
    usp.set("page", String(page));
    return `/admin/works?${usp.toString()}`;
  }

  return (
    <SiteLayout title="管理员作品管理" active="upload" hidePageHead>
      <div className="cel-admin-shell">
        <section className="cel-cinema-panel cel-hero-strip">
          <div>
            <div className="cel-eyebrow">Admin Console · Works</div>
            <h1 className="cel-title-xl">Archive Control</h1>
            <p className="cel-subtitle">
              作品后台改成电影档案库：搜索、筛选、查看和删除入口保留原逻辑，只重做信息密度和视觉层级。
            </p>
          </div>
        </section>

        <section className="cel-cinema-panel" style={{ padding: 22 }}>
          <form
            method="get"
            action="/admin/works"
            className="cel-search-form"
            style={{ gridTemplateColumns: "1fr 190px 130px" }}
          >
            <input name="keyword" defaultValue={keyword} placeholder="按标题搜索作品" />
            <select name="type" defaultValue={type}>
              <option value="">全部类型</option>
              <option value="FOLDER">图集</option>
              <option value="GIF">动图</option>
              <option value="VIDEO">视频</option>
            </select>
            <button type="submit">搜索</button>
          </form>

          <div className="cel-stat-grid" style={{ marginBottom: 18 }}>
            <StatCard label="作品总数" value={totalCount} />
            <StatCard label="当前页" value={currentPage} />
            <StatCard label="总页数" value={totalPages} />
            <StatCard label="本页展示" value={works.length} />
          </div>

          {works.length === 0 ? (
            <EmptyState title="没有找到作品" description="换一个标题或类型试试。" compact />
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {works.map((work) => {
                const cover = work.coverUrl || work.files[0]?.fileUrl || "";

                return (
                  <article
                    key={work.id}
                    className="cel-list-card"
                    style={{ gridTemplateColumns: "132px 1fr auto", alignItems: "center" }}
                  >
                    <Link
                      href={`/works/${work.id}`}
                      style={{ display: "block", width: 132, height: 132, borderRadius: 22, overflow: "hidden", background: "rgba(255,255,255,0.08)", border: "1px solid var(--cel-line)" }}
                    >
                      {work.type === "VIDEO" ? (
                        <VideoFrameCover src={cover} alt={work.title} />
                      ) : cover ? (
                        <img
                          src={cover}
                          alt={work.title}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--cel-soft)", fontWeight: 900 }}>
                          无封面
                        </div>
                      )}
                    </Link>

                    <div>
                      <h2 className="cel-title-md" style={{ fontSize: 26, wordBreak: "break-all" }}>{work.title}</h2>
                      <div className="cel-pill-row" style={{ margin: "12px 0" }}>
                        <span className="cel-pill">ID {work.id}</span>
                        <span className="cel-pill">{getWorkTypeLabel(work.type)}</span>
                        <span className={work.ageRating === "AGE_16_PLUS" ? "cel-pill cel-pill-danger" : "cel-pill"}>
                          {work.ageRating === "AGE_16_PLUS" ? "16+" : "全年龄"}
                        </span>
                        <span className="cel-pill">浏览 {work.viewCount}</span>
                        <span className="cel-pill">媒体 {work.files.length}</span>
                      </div>
                      <div className="cel-meta">
                        作者：{work.author.nickname}　/　上传时间：{new Date(work.createdAt).toLocaleString()}
                        {work.sourceKey ? `　/　来源标记：${work.sourceKey}` : ""}
                      </div>
                    </div>

                    <div className="cel-action-row" style={{ justifyContent: "flex-end" }}>
                      <Link href={`/works/${work.id}`} className="cel-button-light">查看详情</Link>
                      <AdminDeleteWorkInlineButton workId={work.id} title={work.title} />
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <Pager currentPage={currentPage} totalPages={totalPages} buildPageHref={buildPageHref} />
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

function EmptyState({ title, description, compact = false }: { title: string; description: string; compact?: boolean }) {
  return (
    <div className="cel-cinema-panel" style={{ padding: compact ? 18 : 28 }}>
      <h2 className="cel-title-md">{title}</h2>
      <p className="cel-subtitle">{description}</p>
    </div>
  );
}

function Pager({ currentPage, totalPages, buildPageHref }: { currentPage: number; totalPages: number; buildPageHref: (page: number) => string }) {
  return (
    <div className="cel-action-row" style={{ justifyContent: "center", marginTop: 24 }}>
      <Link href={buildPageHref(Math.max(1, currentPage - 1))} className="cel-button-light" style={{ pointerEvents: currentPage <= 1 ? "none" : "auto", opacity: currentPage <= 1 ? 0.5 : 1 }}>
        上一页
      </Link>

      {Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter((p) => {
          if (totalPages <= 9) return true;
          if (p === 1 || p === totalPages) return true;
          return Math.abs(p - currentPage) <= 2;
        })
        .map((p, idx, arr) => {
          const prev = arr[idx - 1];
          return (
            <span key={p} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              {prev && p - prev > 1 && <span className="cel-muted">...</span>}
              <Link href={buildPageHref(p)} className={p === currentPage ? "cel-button-dark" : "cel-button-light"}>{p}</Link>
            </span>
          );
        })}

      <Link href={buildPageHref(Math.min(totalPages, currentPage + 1))} className="cel-button-light" style={{ pointerEvents: currentPage >= totalPages ? "none" : "auto", opacity: currentPage >= totalPages ? 0.5 : 1 }}>
        下一页
      </Link>
    </div>
  );
}
