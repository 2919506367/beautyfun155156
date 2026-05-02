"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Show16PreferenceSelect({
  currentValue,
  currentPath,
  tag = "",
}: {
  currentValue: boolean;
  currentPath: string;
  tag?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(currentValue ? "true" : "false");

  async function handleChange(nextValue: string) {
    setValue(nextValue);
    setLoading(true);

    try {
      const boolValue = nextValue === "true";

      await fetch("/api/preferences/show16", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: boolValue,
        }),
      });

      const usp = new URLSearchParams();
      if (tag) usp.set("tag", tag);
      if (boolValue) usp.set("show16", "true");

      const nextUrl = usp.toString() ? `${currentPath}?${usp.toString()}` : currentPath;
      router.push(nextUrl);
      router.refresh();
    } catch {
      alert("设置16+偏好失败，请稍后再试");
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
      style={{
        width: "100%",
        opacity: loading ? 0.7 : 1,
      }}
    >
      <option value="false">隐藏16+</option>
      <option value="true">显示16+</option>
    </select>
  );
}