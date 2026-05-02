"use client";

import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const STORAGE_KEY = "beautyfun-theme";

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;

  if (theme === "dark") {
    root.classList.add("dark-mode");
  } else {
    root.classList.remove("dark-mode");
  }

  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
}

function getStoredTheme(): ThemeMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function ThemeToggleButton() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = getStoredTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);
    setMounted(true);
  }, []);

  function handleToggle() {
    const nextTheme: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className="topbar-action-btn topbar-theme-btn"
      title="切换深色 / 浅色模式"
      aria-label="切换深色 / 浅色模式"
    >
      <span className="topbar-theme-btn-icon">
        {!mounted ? "◐" : theme === "dark" ? "☀️" : "🌙"}
      </span>
      <span className="topbar-theme-btn-text">
        {!mounted ? "主题" : theme === "dark" ? "浅色" : "深色"}
      </span>
    </button>
  );
}