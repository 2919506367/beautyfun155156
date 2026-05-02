"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const LIST_MEMORY_PREFIX = "beautyfun-list-memory:";
const LAST_LIST_URL_KEY = "beautyfun-last-list-url";

function getCurrentKey(pathname: string, search: string) {
  return `${LIST_MEMORY_PREFIX}${pathname}?${search}`;
}

export function saveCurrentListPosition() {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;
  const search = window.location.search.replace(/^\?/, "");
  const key = getCurrentKey(pathname, search);

  const payload = {
    url: `${pathname}${window.location.search}`,
    scrollY: window.scrollY,
    ts: Date.now(),
  };

  sessionStorage.setItem(key, JSON.stringify(payload));
  sessionStorage.setItem(LAST_LIST_URL_KEY, payload.url);
}

export function getLastListUrl() {
  if (typeof window === "undefined") return "/";
  return sessionStorage.getItem(LAST_LIST_URL_KEY) || "/";
}

export default function ListPageMemory() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams.toString();
    const key = getCurrentKey(pathname, search);
    const raw = sessionStorage.getItem(key);

    if (!raw) return;

    try {
      const data = JSON.parse(raw);
      if (typeof data.scrollY === "number") {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: data.scrollY,
            behavior: "instant" as ScrollBehavior,
          });
        });
      }
    } catch {
      // ignore
    }
  }, [pathname, searchParams]);

  return null;
}