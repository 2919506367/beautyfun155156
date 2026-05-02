"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function SessionStatusGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const [showBannedModal, setShowBannedModal] = useState(false);
  const handledRef = useRef(false);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/login")) return;

    let timer: ReturnType<typeof setInterval> | null = null;
    let stopped = false;

    async function checkStatus() {
      if (handledRef.current || stopped) return;

      try {
        const res = await fetch("/api/auth/session-status", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok) return;

        const data = await res.json();

        if (data?.loggedIn && data?.banned) {
          handledRef.current = true;
          setShowBannedModal(true);

          setTimeout(async () => {
            try {
              await fetch("/api/auth/logout", {
                method: "POST",
              });
            } catch {}

            router.replace("/login");
            router.refresh();
          }, 1800);
        }
      } catch {}
    }

    checkStatus();
    timer = setInterval(checkStatus, 15000);

    return () => {
      stopped = true;
      if (timer) clearInterval(timer);
    };
  }, [pathname, router]);

  if (!showBannedModal) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          borderRadius: 22,
          padding: 24,
          boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "#111827",
            marginBottom: 12,
          }}
        >
          账号已被封禁
        </div>

        <div
          style={{
            fontSize: 14,
            color: "#6b7280",
            lineHeight: 1.8,
          }}
        >
          管理员已封禁你的账号，当前会话将自动退出并返回登录页。
        </div>

        <div
          style={{
            marginTop: 20,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            style={{
              border: "none",
              background: "#111827",
              color: "#fff",
              borderRadius: 12,
              padding: "10px 16px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            即将退出…
          </button>
        </div>
      </div>
    </div>
  );
}