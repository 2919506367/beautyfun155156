import Link from "next/link";
import { notFound } from "next/navigation";
import SiteLayout from "@/components/SiteLayout";
import UserIdentity from "@/components/UserIdentity";
import WorkCardLite from "@/components/WorkCardLite";
import { prisma } from "@/lib/prisma";
import {
  getCurrentLevelProgress,
  getLevelFromXp,
  getNextLevelNeed,
  getRoleLabel,
} from "@/lib/user-display";
import { getCurrentUser } from "@/lib/auth";
import UserFriendActions from "@/components/UserFriendActions";


const PAGE_SIZE = 12;

export default async function PublicUserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    folderPage?: string;
    gifPage?: string;
    videoPage?: string;
  }>;
}) {
  const { id } = await params;
  const userId = Number(id);
const currentUser = await getCurrentUser();

  if (!userId || Number.isNaN(userId)) {
    notFound();
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      account: true,
      nickname: true,
      avatarUrl: true,
      role: true,
      xp: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  const isSelf = currentUser?.id === user.id;
  const safeXp = typeof user.xp === "number" && Number.isFinite(user.xp) ? user.xp : 0;
  const level = getLevelFromXp(safeXp);
  const currentXp = getCurrentLevelProgress(safeXp);
  const nextNeed = getNextLevelNeed();
  const percent = Math.min(100, (currentXp / nextNeed) * 100);

  const query = await searchParams;
  const folderPage = Math.max(1, Number(query.folderPage || "1") || 1);
  const gifPage = Math.max(1, Number(query.gifPage || "1") || 1);
  const videoPage = Math.max(1, Number(query.videoPage || "1") || 1);
  const isAdmin = currentUser?.role === "ADMIN";
  const visibilityWhere = !isAdmin ? { isPublic: true } : {};

  const [folderCount, gifCount, videoCount] = await Promise.all([
    prisma.work.count({
      where: { authorId: user.id, type: "FOLDER", ...visibilityWhere },
    }),
    prisma.work.count({
      where: { authorId: user.id, type: "GIF", ...visibilityWhere },
    }),
    prisma.work.count({
      where: { authorId: user.id, type: "VIDEO", ...visibilityWhere },
    }),
  ]);

  const [folderWorks, gifWorks, videoWorks] = await Promise.all([
    prisma.work.findMany({
      where: { authorId: user.id, type: "FOLDER", ...visibilityWhere },
      orderBy: { createdAt: "desc" },
      skip: (folderPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: true,
        files: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.work.findMany({
      where: { authorId: user.id, type: "GIF", ...visibilityWhere },
      orderBy: { createdAt: "desc" },
      skip: (gifPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: true,
        files: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.work.findMany({
      where: { authorId: user.id, type: "VIDEO", ...visibilityWhere },
      orderBy: { createdAt: "desc" },
      skip: (videoPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        author: true,
        files: {
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
  ]);

  const folderTotalPages = Math.max(1, Math.ceil(folderCount / PAGE_SIZE));
  const gifTotalPages = Math.max(1, Math.ceil(gifCount / PAGE_SIZE));
  const videoTotalPages = Math.max(1, Math.ceil(videoCount / PAGE_SIZE));

  function buildHref(next: {
    folderPage?: number;
    gifPage?: number;
    videoPage?: number;
  }) {
    const usp = new URLSearchParams();

    usp.set("folderPage", String(next.folderPage ?? folderPage));
    usp.set("gifPage", String(next.gifPage ?? gifPage));
    usp.set("videoPage", String(next.videoPage ?? videoPage));

    return `/users/${userId}?${usp.toString()}`;
  }

  return (
    <SiteLayout title={`${user.nickname}的资料`} active="users">
      <div style={panelStyle}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "160px 1fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div>
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.nickname}
                style={{
                  width: 140,
                  height: 140,
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 8px 24px rgba(17,24,39,0.08)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: "50%",
                  background: "#eef2f7",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#6b7280",
                }}
              >
                无头像
              </div>
            )}
          </div>

          <div>
            <div style={metaRow}>
              <b>用户：</b>
              <div style={{ marginTop: 8 }}>
                <UserIdentity
                  userId={user.id}
                  nickname={user.nickname}
                  role={user.role}
                  xp={user.xp}
                  linkToProfile={false}
                />
              </div>
            </div>

            <div style={metaRow}>
              <b>身份等级：</b>{getRoleLabel(user.role)}
            </div>

            <div style={metaRow}>
              <b>用户等级：</b>Lv.{level}
            </div>

            <div style={metaRow}>
              <b>注册时间：</b>{new Date(user.createdAt).toLocaleString()}
            </div>

            <div style={{ marginTop: 16, marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  fontSize: 14,
                  color: "#374151",
                  fontWeight: 700,
                }}
              >
                <span>经验值</span>
                <span>{currentXp} / {nextNeed}</span>
              </div>

              <div className="xp-bar-wrap">
                <div
                  className="xp-bar-fill"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                当前公开展示的是该用户等级与经验进度
              </div>
{!isSelf && <UserFriendActions targetUserId={user.id} />}            </div>
          </div>
        </div>
      </div>




      <WorkSection
        title="TA上传的图集"
        count={folderCount}
        works={folderWorks}
        currentPage={folderPage}
        totalPages={folderTotalPages}
        prevHref={buildHref({ folderPage: Math.max(1, folderPage - 1) })}
        nextHref={buildHref({ folderPage: Math.min(folderTotalPages, folderPage + 1) })}
        pageHrefBuilder={(p) => buildHref({ folderPage: p })}
      />

      <WorkSection
        title="TA上传的动图"
        count={gifCount}
        works={gifWorks}
        currentPage={gifPage}
        totalPages={gifTotalPages}
        prevHref={buildHref({ gifPage: Math.max(1, gifPage - 1) })}
        nextHref={buildHref({ gifPage: Math.min(gifTotalPages, gifPage + 1) })}
        pageHrefBuilder={(p) => buildHref({ gifPage: p })}
      />

      <WorkSection
        title="TA上传的视频"
        count={videoCount}
        works={videoWorks}
        currentPage={videoPage}
        totalPages={videoTotalPages}
        prevHref={buildHref({ videoPage: Math.max(1, videoPage - 1) })}
        nextHref={buildHref({ videoPage: Math.min(videoTotalPages, videoPage + 1) })}
        pageHrefBuilder={(p) => buildHref({ videoPage: p })}
      />
    </SiteLayout>
  );
}

function WorkSection({
  title,
  count,
  works,
  currentPage,
  totalPages,
  prevHref,
  nextHref,
  pageHrefBuilder,
}: {
  title: string;
  count: number;
  works: Array<{
    id: number;
    title: string;
    type: "FOLDER" | "GIF" | "VIDEO";
    createdAt: Date;
    viewCount: number;
    author: {
      id: number;
      nickname: string;
      role: "BASIC" | "GOLD" | "ADMIN";
      xp: number | null;
    };
    coverUrl: string | null;
    files: Array<{ fileUrl: string }>;
  }>;
  currentPage: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
  pageHrefBuilder: (page: number) => string;
}) {
  return (
    <div style={{ ...panelStyle, marginTop: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#111827" }}>{title}</h2>
          <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>
            共 {count} 个作品　/　第 {currentPage} 页，共 {totalPages} 页
          </div>
        </div>
      </div>

      {count > 0 && (
        <SimplePager
          currentPage={currentPage}
          totalPages={totalPages}
          prevHref={prevHref}
          nextHref={nextHref}
          pageHrefBuilder={pageHrefBuilder}
        />
      )}

      {works.length === 0 ? (
        <div style={{ color: "#6b7280" }}>这个分区还没有作品。</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: 22,
          }}
        >
          {works.map((work) => {
            const cover = work.coverUrl || work.files[0]?.fileUrl || "";

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
                timeLabel="上传时间"
                timeValue={new Date(work.createdAt).toLocaleString()}
                cover={cover}
                viewCount={work.viewCount}
                accessMode="allow"
              />
            );
          })}
        </div>
      )}

      {count > 0 && (
        <SimplePager
          currentPage={currentPage}
          totalPages={totalPages}
          prevHref={prevHref}
          nextHref={nextHref}
          pageHrefBuilder={pageHrefBuilder}
        />
      )}
    </div>
  );
}

function SimplePager({
  currentPage,
  totalPages,
  prevHref,
  nextHref,
  pageHrefBuilder,
}: {
  currentPage: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
  pageHrefBuilder: (page: number) => string;
}) {
  const pages = buildPages(currentPage, totalPages);

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "center",
        alignItems: "center",
        flexWrap: "wrap",
        margin: "20px 0",
      }}
    >
      <Link
        href={prevHref}
        style={{
          ...pageBtnStyle,
          pointerEvents: currentPage <= 1 ? "none" : "auto",
          opacity: currentPage <= 1 ? 0.5 : 1,
        }}
      >
        上一页
      </Link>

      {pages.map((item, index) =>
        item === "..." ? (
          <span key={`ellipsis-${index}`} style={{ color: "#666", padding: "0 4px" }}>
            ...
          </span>
        ) : (
          <Link
            key={item}
            href={pageHrefBuilder(item)}
            style={{
              ...pageBtnStyle,
              minWidth: 42,
              textAlign: "center",
              background: item === currentPage ? "#d4af37" : "#111827",
            }}
          >
            {item}
          </Link>
        )
      )}

      <Link
        href={nextHref}
        style={{
          ...pageBtnStyle,
          pointerEvents: currentPage >= totalPages ? "none" : "auto",
          opacity: currentPage >= totalPages ? 0.5 : 1,
        }}
      >
        下一页
      </Link>
    </div>
  );
}

function buildPages(currentPage: number, totalPages: number) {
  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
    return pages;
  }

  pages.push(1);

  if (currentPage > 3) pages.push("...");

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) pages.push(i);

  if (currentPage < totalPages - 2) pages.push("...");

  pages.push(totalPages);

  return pages;
}

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 24,
};

const metaRow: React.CSSProperties = {
  marginBottom: 12,
  color: "#374151",
  fontSize: 15,
};

const pageBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  background: "#111827",
  color: "#fff",
  textDecoration: "none",
  display: "inline-block",
  fontWeight: 700,
};