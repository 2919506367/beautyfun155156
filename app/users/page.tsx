import SiteLayout from "@/components/SiteLayout";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import UserIdentity from "@/components/UserIdentity";

function shuffleArray<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function initials(name: string) {
  return String(name || "用").trim().slice(0, 2);
}

export default async function UsersPage() {
  const currentUser = await getCurrentUser();

  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          works: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const filteredUsers = currentUser
    ? users.filter((user) => user.id !== currentUser.id)
    : users;

  const recommendedUsers = shuffleArray(filteredUsers).slice(0, 12);

  return (
    <SiteLayout title="用户推荐" active="users" hidePageHead>
      <div className="bf-page-shell">
        <section className="bf-section-hero">
          <div className="bf-section-hero-inner">
            <div>
              <div className="bf-hero-kicker-row">
                <span className="bf-hero-kicker"><span className="bf-hero-kicker-dot" /> People Discovery</span>
                <span className="bf-hero-kicker">随机推荐</span>
                <span className="bf-hero-kicker">用户主页</span>
              </div>
              <h1 className="bf-hero-title-xl">用户推荐</h1>
              <p className="bf-hero-subtitle-lg">
                发现站内其他创作者和用户。点击用户卡片可以进入对方主页，查看身份、等级和上传作品。
              </p>
            </div>
            <aside className="bf-hero-side-card">
              <div className="bf-stats-grid" style={{ gridTemplateColumns: "1fr" }}>
                <MiniStat label="可推荐用户" value={String(filteredUsers.length)} />
                <MiniStat label="本次展示" value={String(recommendedUsers.length)} />
              </div>
            </aside>
          </div>
        </section>

        <section className="bf-page-panel">
          <div className="bf-panel-head">
            <div>
              <h2 className="bf-panel-title">随机推荐用户</h2>
              <div className="bf-panel-subtitle">每次刷新会随机抽取一批用户；好友、私信等业务逻辑不变。</div>
            </div>
          </div>

          {recommendedUsers.length === 0 ? (
            <div className="bf-empty-state">无用户推荐</div>
          ) : (
            <div className="bf-user-grid">
              {recommendedUsers.map((user) => (
                <Link key={user.id} href={`/users/${user.id}`} className="bf-user-card">
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.nickname} className="bf-avatar-xl" />
                    ) : (
                      <div className="bf-avatar-xl">{initials(user.nickname)}</div>
                    )}

                    <div style={{ marginTop: 14, marginBottom: 8 }}>
                      <UserIdentity userId={user.id} nickname={user.nickname} role={user.role} xp={user.xp} />
                    </div>

                    <div style={{ fontSize: 13, color: "var(--bf-neo-muted)", fontWeight: 800 }}>
                      上传作品：{user._count.works}
                    </div>
                  </div>
                </Link>
              ))}
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
