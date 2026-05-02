import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SiteLayout from "@/components/SiteLayout";
import AdminSetUserRoleInline from "@/components/AdminSetUserRoleInline";
import UserIdentity from "@/components/UserIdentity";
import { getRoleLabel } from "@/lib/user-display";
import AdminSetUserStatusInline from "@/components/AdminSetUserStatusInline";

const PAGE_SIZE = 30;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    keyword?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (!user) {
    return (
      <SiteLayout title="管理员用户管理" active="admin">
        <EmptyState title="请先登录" description="登录管理员账号后才能进入用户控制台。" />
      </SiteLayout>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <SiteLayout title="管理员用户管理" active="profile">
        <EmptyState title="权限不足" description="只有管理员可以访问这个页面。" />
      </SiteLayout>
    );
  }

  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const keyword = String(params.keyword || "").trim();

  const where = keyword
    ? {
        OR: [
          { nickname: { contains: keyword } },
          { account: { contains: keyword } },
        ],
      }
    : {};

  const totalCount = await prisma.user.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      _count: {
        select: {
          works: true,
          comments: true,
          favorites: true,
          histories: true,
        },
      },
    },
  });

  function buildPageHref(page: number) {
    const usp = new URLSearchParams();
    if (keyword) usp.set("keyword", keyword);
    usp.set("page", String(page));
    return `/admin/users?${usp.toString()}`;
  }

  return (
    <SiteLayout title="管理员用户管理" active="profile" hidePageHead>
      <div className="cel-admin-shell">
        <section className="cel-cinema-panel cel-hero-strip">
          <div>
            <div className="cel-eyebrow">Admin Console · Users</div>
            <h1 className="cel-title-xl">User Control</h1>
            <p className="cel-subtitle">
              管理用户身份、封禁、禁言和站内活跃度。保持原有后台逻辑，只把后台界面压成 Celestia 风格的高级控制台。
            </p>
          </div>
        </section>

        <section className="cel-cinema-panel" style={{ padding: 22 }}>
          <form
            method="get"
            action="/admin/users"
            className="cel-search-form"
            style={{ gridTemplateColumns: "1fr 130px" }}
          >
            <input name="keyword" defaultValue={keyword} placeholder="按昵称或账号搜索用户" />
            <button type="submit">搜索</button>
          </form>

          <div className="cel-stat-grid" style={{ marginBottom: 18 }}>
            <StatCard label="用户总数" value={totalCount} />
            <StatCard label="当前页" value={currentPage} />
            <StatCard label="总页数" value={totalPages} />
            <StatCard label="本页展示" value={users.length} />
          </div>

          {users.length === 0 ? (
            <EmptyState title="没有找到用户" description="换一个关键词试试。" compact />
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {users.map((item) => (
                <article
                  key={item.id}
                  className="cel-list-card"
                  style={{ gridTemplateColumns: "92px 1fr auto", alignItems: "center" }}
                >
                  <div className="cel-avatar-ring" style={{ width: 92, height: 92 }}>
                    {item.avatarUrl ? (
                      <img
                        src={item.avatarUrl}
                        alt={item.nickname}
                        loading="lazy"
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--cel-soft)", fontWeight: 900 }}>
                        {item.nickname.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <div style={{ marginBottom: 10 }}>
                      <UserIdentity userId={item.id} nickname={item.nickname} role={item.role} xp={item.xp} />
                    </div>

                    <div className="cel-pill-row" style={{ marginBottom: 10 }}>
                      <span className="cel-pill">ID {item.id}</span>
                      <span className="cel-pill">账号 {item.account}</span>
                      <span className="cel-pill cel-pill-gold">{getRoleLabel(item.role)}</span>
                      <span className={item.isBanned ? "cel-pill cel-pill-danger" : "cel-pill"}>
                        {item.isBanned ? "已封禁" : "正常登录"}
                      </span>
                      <span className={item.isMuted ? "cel-pill cel-pill-danger" : "cel-pill"}>
                        {item.isMuted ? "已禁言" : "可发言"}
                      </span>
                    </div>

                    <div className="cel-meta">
                      注册时间：{new Date(item.createdAt).toLocaleString()}　/　作品 {item._count.works}　评论 {item._count.comments}　收藏 {item._count.favorites}　历史 {item._count.histories}
                    </div>
                  </div>

                  <div className="cel-action-row" style={{ justifyContent: "flex-end" }}>
                    <AdminSetUserRoleInline account={item.account} currentRole={item.role} />
                    <AdminSetUserStatusInline
                      account={item.account}
                      initialIsBanned={item.isBanned}
                      initialIsMuted={item.isMuted}
                    />
                  </div>
                </article>
              ))}
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

function Pager({
  currentPage,
  totalPages,
  buildPageHref,
}: {
  currentPage: number;
  totalPages: number;
  buildPageHref: (page: number) => string;
}) {
  return (
    <div className="cel-action-row" style={{ justifyContent: "center", marginTop: 24 }}>
      <a
        href={buildPageHref(Math.max(1, currentPage - 1))}
        className="cel-button-light"
        style={{ pointerEvents: currentPage <= 1 ? "none" : "auto", opacity: currentPage <= 1 ? 0.5 : 1 }}
      >
        上一页
      </a>

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
              <a href={buildPageHref(p)} className={p === currentPage ? "cel-button-dark" : "cel-button-light"}>
                {p}
              </a>
            </span>
          );
        })}

      <a
        href={buildPageHref(Math.min(totalPages, currentPage + 1))}
        className="cel-button-light"
        style={{ pointerEvents: currentPage >= totalPages ? "none" : "auto", opacity: currentPage >= totalPages ? 0.5 : 1 }}
      >
        下一页
      </a>
    </div>
  );
}
