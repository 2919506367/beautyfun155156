import SiteLayout from "@/components/SiteLayout";
import WorkCardLite from "@/components/WorkCardLite";
import PaginationBar from "@/components/PaginationBar";
import UserIdentity from "@/components/UserIdentity";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 48;

function getTypeLabel(type: string) {
  if (type === "FOLDER") return "图集";
  if (type === "GIF") return "动图";
  if (type === "VIDEO") return "视频";
  return "全部";
}

function initials(name: string) {
  return String(name || "用").trim().slice(0, 2);
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    page?: string;
    type?: string;
    mode?: string;
    tag?: string;
    show16?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  const keyword = typeof params.q === "string" ? params.q.trim() : "";
  const mode = params.mode === "user" ? "user" : "work";
  const numericId = /^\d+$/.test(keyword) ? Number(keyword) : null;

  const users =
    mode === "user" && keyword
      ? await prisma.user.findMany({
          where: {
            OR: [
              { account: { contains: keyword } },
              { nickname: { contains: keyword } },
              ...(numericId !== null ? [{ id: numericId }] : []),
            ],
          },
          select: {
            id: true,
            account: true,
            nickname: true,
            avatarUrl: true,
            role: true,
            xp: true,
            createdAt: true,
            _count: {
              select: {
                works: true,
                comments: true,
                favorites: true,
                histories: true,
              },
            },
          },
          orderBy: [{ id: "desc" }],
          take: 30,
        })
      : [];

  const type = String(params.type || "").trim();
  const currentPage = Math.max(1, Number(params.page || "1") || 1);
  const workType = type === "FOLDER" || type === "GIF" || type === "VIDEO" ? type : "";
  const tag = String(params.tag || "").trim();
  const show16 = String(params.show16 || "") === "true";

  const where =
    keyword || workType || tag || !show16
      ? {
          ...(keyword ? { title: { contains: keyword } } : {}),
          ...(workType ? { type: workType as "FOLDER" | "GIF" | "VIDEO" } : {}),
          ...(tag ? { tags: { contains: tag } } : {}),
          ...(!show16 ? { ageRating: "ALL_AGES" as const } : {}),
        }
      : undefined;

  const totalCount =
    mode === "work" && where
      ? await prisma.work.count({ where })
      : mode === "user"
      ? users.length
      : 0;

  const totalPages = mode === "work" ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : 1;

  const works =
    mode === "work" && where
      ? await prisma.work.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (currentPage - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: {
            author: true,
            files: { orderBy: { sortOrder: "asc" } },
            _count: { select: { files: true } },
          },
        })
      : [];

  function buildBasePath() {
    const usp = new URLSearchParams();
    if (keyword) usp.set("q", keyword);
    if (workType) usp.set("type", workType);
    if (mode) usp.set("mode", mode);
    if (tag) usp.set("tag", tag);
    if (show16) usp.set("show16", "true");
    return `/search?${usp.toString()}`;
  }

  const hasCondition = Boolean(keyword || workType || tag);

  return (
    <SiteLayout title="搜索结果" active="folders" hidePageHead>
      <div className="bf-page-shell">
        <section className="bf-section-hero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> Search Console</span>
                <span className="bf-hero-kicker">作品 / 用户</span>
                <span className="bf-hero-kicker">标签过滤</span>
              </div>
              <h1 className="bf-hero-title-xl">搜索中心</h1>
              <p className="bf-hero-subtitle-lg">
                搜索作品标题、作品标签，也可以切换到用户模式查找账号、昵称或用户 ID。查询参数和后端逻辑保持原样。
              </p>
            </div>
            <aside className="bf-hero-side-card">
              <div className="bf-stats-grid" style={{ gridTemplateColumns: "1fr" }}>
                <MiniStat label="当前模式" value={mode === "user" ? "用户" : "作品"} />
                <MiniStat label="结果数量" value={String(totalCount)} />
                <MiniStat label="16+" value={show16 ? "显示" : "隐藏"} />
              </div>
            </aside>
          </div>
        </section>

        <section className="bf-page-panel">
          <form method="get" action="/search" className="bf-form-grid" style={{ marginBottom: 22 }}>
            <input name="q" defaultValue={keyword} placeholder={mode === "user" ? "输入账号、昵称或用户ID..." : "搜索作品标题..."} />
            <input name="tag" defaultValue={tag} placeholder="按标签筛选" />
            <select name="show16" defaultValue={show16 ? "true" : "false"}>
              <option value="false">隐藏16+</option>
              <option value="true">显示16+</option>
            </select>
            <select name="type" defaultValue={workType}>
              <option value="">全部类型</option>
              <option value="FOLDER">图集</option>
              <option value="GIF">动图</option>
              <option value="VIDEO">视频</option>
            </select>
            <select name="mode" defaultValue={mode}>
              <option value="work">作品</option>
              <option value="user">用户</option>
            </select>
            <button type="submit">搜索</button>
          </form>

          <div className="bf-panel-head">
            <div>
              <h2 className="bf-panel-title">{hasCondition ? "搜索结果" : "请输入搜索条件"}</h2>
              <div className="bf-panel-subtitle">
                关键词：{keyword || "未填写"}　/　模式：{mode === "user" ? "用户" : "作品"}
                {mode === "work" ? `　/　类型：${getTypeLabel(workType)}　/　标签：${tag || "未筛选"}　/　16+：${show16 ? "显示" : "隐藏"}` : ""}
                {hasCondition ? `　/　共找到 ${totalCount} 个结果` : ""}
              </div>
            </div>
            {mode === "work" && hasCondition && totalCount > 0 && (
              <PaginationBar basePath={buildBasePath()} currentPage={currentPage} totalPages={totalPages} />
            )}
          </div>

          {!hasCondition ? (
            <div className="bf-empty-state">
              {mode === "user" ? "输入账号、昵称或用户ID来查找用户。" : "输入作品标题、标签或类型来查找作品。"}
            </div>
          ) : mode === "user" ? (
            users.length === 0 ? (
              <div className="bf-empty-state">没有找到相关用户。</div>
            ) : (
              <div className="bf-user-grid">
                {users.map((item) => (
                  <a key={item.id} href={`/users/${item.id}`} className="bf-user-card">
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      {item.avatarUrl ? (
                        <img src={item.avatarUrl} alt={item.nickname} className="bf-avatar-xl" style={{ width: 78, height: 78, borderRadius: 26 }} />
                      ) : (
                        <div className="bf-avatar-xl" style={{ width: 78, height: 78, borderRadius: 26 }}>{initials(item.nickname)}</div>
                      )}

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ marginBottom: 8 }}>
                          <UserIdentity userId={item.id} nickname={item.nickname} role={item.role} xp={item.xp} />
                        </div>
                        <div style={{ color: "var(--bf-neo-muted)", fontSize: 13, lineHeight: 1.8, fontWeight: 700 }}>
                          账号：{item.account}<br />
                          用户ID：{item.id}<br />
                          作品：{item._count.works}　评论：{item._count.comments}　收藏：{item._count.favorites}
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            )
          ) : works.length === 0 ? (
            <div className="bf-empty-state">没有找到相关作品。</div>
          ) : (
            <div className="bf-responsive-grid works-grid">
              {works.map((work) => {
                const cover = work.coverUrl || work.files[0]?.fileUrl || "";
                let accessMode: "allow" | "login_required" | "hot_locked" = "allow";

                if (!user) accessMode = "login_required";
                else if (work.viewCount >= 99 && user.role === "BASIC") accessMode = "hot_locked";

                return (
                  <WorkCardLite
                    key={work.id}
                    href={`/works/${work.id}`}
                    title={work.title}
                    type={work.type}
                    authorId={work.author.id}
                    authorName={work.author.nickname}
                    authorRole={work.author.role}
                    authorXp={work.author.xp}
                    pageCount={work._count.files}
                    timeLabel="上传时间"
                    timeValue={new Date(work.createdAt).toLocaleString()}
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

          {mode === "work" && hasCondition && totalCount > 0 && (
            <div style={{ marginTop: 22 }}>
              <PaginationBar basePath={buildBasePath()} currentPage={currentPage} totalPages={totalPages} />
            </div>
          )}
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
