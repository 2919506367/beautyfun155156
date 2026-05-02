"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminToggleWorkPublicButton({
  workId,
  initialIsPublic,
}: {
  workId: number;
  initialIsPublic: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const nextValue = !initialIsPublic;
    const confirmText = nextValue
      ? "确定要把这个作品改为对外开放吗？普通用户和黄金会员将按原权限规则看到它。"
      : "确定要把这个作品改为不对外开放吗？之后只有管理员可以看到它。";

    if (!window.confirm(confirmText)) return;

    setLoading(true);

    try {
      const res = await fetch("/api/admin/toggle-work-public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workId,
          isPublic: nextValue,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "修改作品开放状态失败");
      }

      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "修改作品开放状态失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={initialIsPublic ? "cel-button-light" : "cel-button-dark"}
      style={{
        opacity: loading ? 0.65 : 1,
        cursor: loading ? "not-allowed" : "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {loading
        ? "处理中..."
        : initialIsPublic
        ? "设为不开放"
        : "设为开放"}
    </button>
  );
}
