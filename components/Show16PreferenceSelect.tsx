"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Show16PreferenceSelect({
  currentValue,
  currentPath,
  tag = "",
  canUseShow16 = true,
}: {
  currentValue: boolean;
  currentPath: string;
  tag?: string;
  canUseShow16?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(currentValue && canUseShow16 ? "true" : "false");

  async function handleChange(nextValue: string) {
    if (nextValue === "true" && !canUseShow16) {
      setValue("false");
      alert("普通用户无法开启16+模式，只有黄金会员和管理员可以开启。");
      return;
    }

    setValue(nextValue);
    setLoading(true);

    try {
      const boolValue = nextValue === "true";

      const res = await fetch("/api/preferences/show16", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: boolValue,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "设置16+偏好失败");
      }

      const usp = new URLSearchParams();
      if (tag) usp.set("tag", tag);
      if (boolValue) usp.set("show16", "true");

      const nextUrl = usp.toString() ? `${currentPath}?${usp.toString()}` : currentPath;
      router.push(nextUrl);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "设置16+偏好失败，请稍后再试";
      alert(message);
      setValue("false");
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="bf-native-select bf-show16-select"
      title={canUseShow16 ? "16+显示设置" : "普通用户无法开启16+模式"}
      style={{
        width: "100%",
        opacity: loading ? 0.7 : 1,
      }}
    >
      <option value="false">隐藏16+</option>
      <option value="true" disabled={!canUseShow16}>
        {canUseShow16 ? "显示16+" : "显示16+（会员）"}
      </option>
    </select>
  );
}
