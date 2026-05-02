import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import ProfileForm from "@/components/ProfileForm";
import SiteLayout from "@/components/SiteLayout";
import LogoutButton from "@/components/LogoutButton";
import { prisma } from "@/lib/prisma";
import WorkCardLite from "@/components/WorkCardLite";
import UserIdentity from "@/components/UserIdentity";
import {
  getCurrentLevelProgress,
  getLevelFromXp,
  getNextLevelNeed,
  getRoleLabel,
} from "@/lib/user-display";
import FriendRequestPanel from "@/components/FriendRequestPanel";
import FriendListPanel from "@/components/FriendListPanel";
import GroupListPanel from "@/components/GroupListPanel";

const PAGE_SIZE = 12;

type ProfileWork = {
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
  tags: string | null;
  ageRating: "ALL_AGES" | "AGE_16_PLUS";
  files: Array<{ fileUrl: string }>;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{
    folderPage?: string;
    gifPage?: string;
    videoPage?: string;
  }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <SiteLayout title="个人资料" active="profile">
        <section className="cel-cinema-panel" style={{ padding: 28 }}>
          <h2 className="cel-title-md">用户资料</h2>
          <p className="cel-subtitle">你还没有登录。</p>
          <Link href="/login" className="cel-button-dark">去登录</Link>
        </section>
      </SiteLayout>
    );
  }

  const safeXp = typeof user.xp === "number" && Number.isFinite(user.xp) ? user.xp : 0;
  const level = getLevelFromXp(safeXp);
  const currentXp = getCurrentLevelProgress(safeXp);
  const nextNeed = getNextLevelNeed();
  const percent = Math.min(100, (currentXp / nextNeed) * 100);
  const params = await searchParams;

  const folderPage = Math.max(1, Number(params.folderPage || "1") || 1);
  const gifPage = Math.max(1, Number(params.gifPage || "1") || 1);
  const videoPage = Math.max(1, Number(params.videoPage || "1") || 1);

  const [folderCount, gifCount, videoCount, groups, pendingFriendRequests, friendships] = await Promise.all([
    prisma.work.count({ where: { authorId: user.id, type: "FOLDER" } }),
    prisma.work.count({ where: { authorId: user.id, type: "GIF" } }),
    prisma.work.count({ where: { authorId: user.id, type: "VIDEO" } }),
    prisma.groupChat.findMany({
      where: { members: { some: { userId: user.id } } },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true, _count: { select: { members: true } } },
    }),
    prisma.friendRequest.findMany({
      where: { toUserId: user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true, fromUser: { select: { id: true, nickname: true, account: true } } },
    }),
    prisma.friendship.findMany({
      where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        user1: { select: { id: true, nickname: true, account: true, avatarUrl: true, role: true, xp: true } },
        user2: { select: { id: true, nickname: true, account: true, avatarUrl: true, role: true, xp: true } },
      },
    }),
  ]);

  const [folderWorks, gifWorks, videoWorks] = await Promise.all([
    prisma.work.findMany({
      where: { authorId: user.id, type: "FOLDER" },
      orderBy: { createdAt: "desc" },
      skip: (folderPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { author: true, files: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.work.findMany({
      where: { authorId: user.id, type: "GIF" },
      orderBy: { createdAt: "desc" },
      skip: (gifPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { author: true, files: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.work.findMany({
      where: { authorId: user.id, type: "VIDEO" },
      orderBy: { createdAt: "desc" },
      skip: (videoPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { author: true, files: { orderBy: { sortOrder: "asc" } } },
    }),
  ]);

  const folderTotalPages = Math.max(1, Math.ceil(folderCount / PAGE_SIZE));
  const gifTotalPages = Math.max(1, Math.ceil(gifCount / PAGE_SIZE));
  const videoTotalPages = Math.max(1, Math.ceil(videoCount / PAGE_SIZE));

  function buildHref(next: { folderPage?: number; gifPage?: number; videoPage?: number }) {
    const usp = new URLSearchParams();
    usp.set("folderPage", String(next.folderPage ?? folderPage));
    usp.set("gifPage", String(next.gifPage ?? gifPage));
    usp.set("videoPage", String(next.videoPage ?? videoPage));
    return `/profile?${usp.toString()}`;
  }

  const friends = friendships.map((item) => {
    const friend = item.user1.id === user.id ? item.user2 : item.user1;
    return {
      friendshipId: item.id,
      createdAt: item.createdAt.toISOString(),
      friend: {
        id: friend.id,
        nickname: friend.nickname,
        account: friend.account,
        avatarUrl: friend.avatarUrl,
        role: friend.role,
        xp: friend.xp,
      },
    };
  });

  const groupItems = groups.map((item) => ({
    id: item.id,
    name: item.name,
    createdAt: item.createdAt.toISOString(),
    memberCount: item._count.members,
  }));

  return (
    <SiteLayout title="个人资料" active="profile" hidePageHead>
      <div className="cel-profile-shell">
        <section className="cel-cinema-panel cel-hero-strip">
          <div>
            <div className="cel-eyebrow">Profile · Private Studio</div>
            <h1 className="cel-title-xl">Personal Orbit</h1>
            <p className="cel-subtitle">
              个人资料、好友、群聊和自己的作品库统一压成 Celestia 私人仪表盘。修改昵称、头像、退出登录和分页逻辑都保留。
            </p>
          </div>
        </section>

        <section className="cel-cinema-panel" style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "170px 1fr", gap: 24, alignItems: "start" }}>
            <div className="cel-avatar-ring" style={{ width: 150, height: 150 }}>
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center", color: "var(--cel-soft)", fontWeight: 950 }}>
                  无头像
                </div>
              )}
            </div>

            <div>
              <div className="cel-pill-row" style={{ marginBottom: 14 }}>
                <span className="cel-pill">账号 {user.account}</span>
                <span className="cel-pill cel-pill-gold">{getRoleLabel(user.role)}</span>
                <span className="cel-pill">Lv.{level}</span>
                <span className="cel-pill">XP {currentXp}/{nextNeed}</span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <UserIdentity userId={user.id} nickname={user.nickname} role={user.role} xp={user.xp} />
              </div>

              <div style={{ marginTop: 16, marginBottom: 18 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, color: "var(--cel-ink)", fontWeight: 900 }}>
                  <span>经验值</span>
                  <span>{currentXp} / {nextNeed}</span>
                </div>
                <div className="xp-bar-wrap"><div className="xp-bar-fill" style={{ width: `${percent}%` }} /></div>
                <div className="cel-meta" style={{ marginTop: 8 }}>每看一次作品 +10 经验，每 100 经验升 1 级</div>
              </div>

              <div className="cel-action-row" style={{ marginTop: 18, marginBottom: 24 }}>
                <Link href="/chats" className="cel-button-dark">消息中心</Link>
                <Link href="/emoticons" className="cel-button-light">我的表情包</Link>
                <LogoutButton />
              </div>

              <div style={{ marginTop: 24 }}>
                <ProfileForm currentNickname={user.nickname} currentAvatarUrl={user.avatarUrl || ""} />
              </div>
            </div>
          </div>
        </section>

        <div className="cel-stat-grid">
          <StatCard label="图集" value={folderCount} />
          <StatCard label="动图" value={gifCount} />
          <StatCard label="视频" value={videoCount} />
          <StatCard label="好友" value={friends.length} />
        </div>

        <FriendRequestPanel requests={pendingFriendRequests.map((item) => ({
          id: item.id,
          createdAt: item.createdAt.toISOString(),
          fromUser: { id: item.fromUser.id, nickname: item.fromUser.nickname, account: item.fromUser.account },
        }))} />

        <FriendListPanel friends={friends} />
        <GroupListPanel groups={groupItems} />

        <WorkSection title="我上传的图集" count={folderCount} works={folderWorks as ProfileWork[]} currentPage={folderPage} totalPages={folderTotalPages} prevHref={buildHref({ folderPage: Math.max(1, folderPage - 1) })} nextHref={buildHref({ folderPage: Math.min(folderTotalPages, folderPage + 1) })} pageHrefBuilder={(p) => buildHref({ folderPage: p })} />
        <WorkSection title="我上传的动图" count={gifCount} works={gifWorks as ProfileWork[]} currentPage={gifPage} totalPages={gifTotalPages} prevHref={buildHref({ gifPage: Math.max(1, gifPage - 1) })} nextHref={buildHref({ gifPage: Math.min(gifTotalPages, gifPage + 1) })} pageHrefBuilder={(p) => buildHref({ gifPage: p })} />
        <WorkSection title="我上传的视频" count={videoCount} works={videoWorks as ProfileWork[]} currentPage={videoPage} totalPages={videoTotalPages} prevHref={buildHref({ videoPage: Math.max(1, videoPage - 1) })} nextHref={buildHref({ videoPage: Math.min(videoTotalPages, videoPage + 1) })} pageHrefBuilder={(p) => buildHref({ videoPage: p })} />
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
  works: ProfileWork[];
  currentPage: number;
  totalPages: number;
  prevHref: string;
  nextHref: string;
  pageHrefBuilder: (page: number) => string;
}) {
  return (
    <section className="cel-cinema-panel" style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h2 className="cel-title-md">{title}</h2>
          <div className="cel-meta" style={{ marginTop: 6 }}>共 {count} 个作品　/　第 {currentPage} 页，共 {totalPages} 页</div>
        </div>
      </div>

      {count > 0 && <SimplePager currentPage={currentPage} totalPages={totalPages} prevHref={prevHref} nextHref={nextHref} pageHrefBuilder={pageHrefBuilder} />}

      {works.length === 0 ? (
        <div className="cel-list-card cel-muted">这个分区还没有作品。</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 22 }}>
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
                tags={work.tags ?? undefined}
                ageRating={work.ageRating}
                accessMode="allow"
              />
            );
          })}
        </div>
      )}

      {count > 0 && <SimplePager currentPage={currentPage} totalPages={totalPages} prevHref={prevHref} nextHref={nextHref} pageHrefBuilder={pageHrefBuilder} />}
    </section>
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
    <div className="cel-action-row" style={{ justifyContent: "center", margin: "20px 0" }}>
      <Link href={prevHref} className="cel-button-light" style={{ pointerEvents: currentPage <= 1 ? "none" : "auto", opacity: currentPage <= 1 ? 0.5 : 1 }}>上一页</Link>
      {pages.map((item, index) => item === "..." ? (
        <span key={`ellipsis-${index}`} className="cel-muted">...</span>
      ) : (
        <Link key={item} href={pageHrefBuilder(item)} className={item === currentPage ? "cel-button-dark" : "cel-button-light"}>{item}</Link>
      ))}
      <Link href={nextHref} className="cel-button-light" style={{ pointerEvents: currentPage >= totalPages ? "none" : "auto", opacity: currentPage >= totalPages ? 0.5 : 1 }}>下一页</Link>
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
