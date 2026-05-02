"use client";

import Link from "next/link";
import ThemeToggleButton from "@/components/ThemeToggleButton";
import { getLevelFromXp, getRoleClassName, getRoleLabel } from "@/lib/user-display";

type TopbarUser = {
  id: number;
  account: string;
  nickname: string;
  avatarUrl: string | null;
  role: "BASIC" | "GOLD" | "ADMIN" | string;
  xp: number;
};

export default function TopBar({ user }: { user: TopbarUser | null }) {
  const safeRole = normalizeRole(user?.role);
  const level = getLevelFromXp(Math.max(0, Math.floor(user?.xp || 0)));

  return (
    <header className="topbar">
      <div className="topbar-inner topbar-inner-fixed">
        <Link href="/" className="topbar-logo" aria-label="返回 BeautyFun 首页">
          <span className="topbar-logo-mark">✦</span>
          <span className="topbar-logo-text">BeautyFun</span>
        </Link>

        <form method="get" action="/search" className="topbar-search topbar-search-fixed">
          <span className="topbar-search-icon">⌕</span>
          <input name="q" placeholder="搜索作品标题..." className="topbar-search-input" />
          <select name="type" defaultValue="" className="topbar-search-select" aria-label="搜索类型">
            <option value="">全部</option>
            <option value="FOLDER">图集</option>
            <option value="GIF">动图</option>
            <option value="VIDEO">视频</option>
          </select>
          <button type="submit" className="topbar-search-btn">搜索</button>
        </form>

        <nav className="topbar-quick-nav" aria-label="快捷入口">
          <ThemeToggleButton />
          {user ? (
            <>
              <TopAction href="/chats" label="聊天" icon="💬" />
              <TopAction href="/upload" label="上传" icon="⬆" />
              <TopAction href="/favorites" label="收藏" icon="⭐" />
              <TopAction href="/history" label="历史" icon="🕘" />

              <Link href="/profile" className="topbar-user-compact" aria-label="进入个人资料">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="avatar" className="topbar-avatar" />
                ) : (
                  <span className="topbar-avatar-fallback">我</span>
                )}
                <span className="topbar-user-compact-name">{user.nickname}</span>
                <span className={`topbar-user-compact-role ${getRoleClassName(safeRole)}`}>
                  {getRoleLabel(safeRole)}
                </span>
                <span className="topbar-user-compact-level">Lv.{level}</span>
              </Link>
            </>
          ) : (
            <Link href="/login" className="topbar-login-btn">登录 / 注册</Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function TopAction({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link href={href} className="topbar-action-btn topbar-action-compact" aria-label={label}>
      <span className="topbar-action-icon">{icon}</span>
      <span className="topbar-action-text">{label}</span>
    </Link>
  );
}

function normalizeRole(role: TopbarUser["role"] | undefined): "BASIC" | "GOLD" | "ADMIN" {
  if (role === "GOLD" || role === "ADMIN") return role;
  return "BASIC";
}
