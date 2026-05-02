"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "📁 图集", key: "folders" },
  { href: "/gifs", label: "🎞 动图", key: "gifs" },
  { href: "/videos", label: "🎬 视频", key: "videos" },
  { href: "/forum", label: "📰 论坛", key: "forum" },
  { href: "/chats", label: "💬 聊天", key: "chats" },
  { href: "/favorites", label: "⭐ 收藏", key: "favorites" },
  { href: "/history", label: "🕘 历史", key: "history" },
  { href: "/users", label: "🧑 用户", key: "users" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/" || pathname.startsWith("/folders");
    return pathname.startsWith(href);
  }

  return (
    <nav className="bf-bottom-nav">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`bf-bottom-nav-item${isActive(item.href) ? " bf-bottom-nav-item-active" : ""}`}
        >
          <span className="bf-bottom-nav-icon">{item.label.split(" ")[0]}</span>
          <span className="bf-bottom-nav-label">{item.label.split(" ")[1]}</span>
        </Link>
      ))}
    </nav>
  );
}
