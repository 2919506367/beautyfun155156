import Link from "next/link";
import TopBar from "@/components/TopBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import { getCurrentUser } from "@/lib/auth";
import SessionStatusGuard from "@/components/SessionStatusGuard";

export default async function SiteLayout({
  title,
  active,
  children,
  hidePageHead = false,
}: {
  title: string;
  active:
    | "folders"
    | "gifs"
    | "videos"
    | "forum"
    | "favorites"
    | "history"
    | "upload"
    | "profile"
    | "users"
    | "admin"
    | "chats";
  children: React.ReactNode;
  hidePageHead?: boolean;
}) {
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="site-shell">
      <SessionStatusGuard />
      <TopBar
        user={user ? {
          id: user.id,
          account: user.account,
          nickname: user.nickname,
          avatarUrl: user.avatarUrl,
          role: user.role,
          xp: user.xp,
        } : null}
      />

      <div className="site-body">
        <aside className="site-sidebar">
          <div className="site-sidebar-inner">
            <div className="site-group-title">浏览分区</div>

            <div className="site-nav-list">
              <NavItem href="/" label="🖼 图集专区" active={active === "folders"} />
              <NavItem href="/gifs" label="🎞 动图区" active={active === "gifs"} />
              <NavItem href="/videos" label="🎬 视频区" active={active === "videos"} />
              <NavItem href="/forum" label="📰 论坛社区" active={active === "forum"} />
            </div>

            <div className="site-divider" />

            <div className="site-group-title">个人功能</div>

            <div className="site-nav-list">
              <NavItem href="/chats" label="💬 消息中心" active={active === "chats"} />
              <NavItem href="/favorites" label="⭐ 我的收藏" active={active === "favorites"} />
              <NavItem href="/history" label="🕘 观看历史" active={active === "history"} />
              <NavItem href="/upload" label="⬆ 上传作品" active={active === "upload"} />
              <NavItem href="/profile" label="👤 个人资料" active={active === "profile"} />
              <NavItem
                href="/membership"
                label="💎 会员中心"
                active={active === "profile" && title.includes("会员")}
              />
              <NavItem href="/users" label="🧑 用户推荐" active={active === "users"} />
            </div>

            {isAdmin && (
              <>
                <div className="site-divider" />

                <div className="site-group-title">管理员面板</div>

                <div className="site-nav-list">
                  <NavItem
                    href="/admin/works"
                    label="🗂 作品管理"
                    active={active === "admin" && title.includes("作品")}
                  />
                  <NavItem
                    href="/admin/users"
                    label="🛠 用户管理"
                    active={active === "admin" && title.includes("用户")}
                  />
                  <NavItem
                    href="/admin/cdks"
                    label="🎟 CDK管理"
                    active={active === "admin" && title.includes("CDK")}
                  />
                  <NavItem
                    href="/forum/admin/create"
                    label="📝 论坛发帖"
                    active={active === "forum" && title.includes("发布")}
                  />
                  <NavItem
                    href="/forum/admin/manage"
                    label="🧰 论坛管理"
                    active={active === "forum" && title.includes("管理")}
                  />
                </div>
              </>
            )}
          </div>
        </aside>

        <main className="site-main">
          {!hidePageHead && active !== "forum" && (
            <div className="site-page-head">
              <div>
                <h1 className="site-page-title">{title}</h1>
                <div className="site-page-subtitle">
                  沉浸式美学内容社区 · 探索无限灵感
                </div>
              </div>
            </div>
          )}

          <div className="site-main-content">{children}</div>
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`site-nav-item ${active ? "site-nav-item-active" : ""}`}
    >
      <span className="site-nav-item-label">{label}</span>
    </Link>
  );
}