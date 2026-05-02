"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function ForumCommentSortBar({
  sort,
}: {
  sort: "latest" | "hot";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateSort(nextSort: "latest" | "hot") {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set("commentSort", nextSort);
    router.push(`?${sp.toString()}`);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "center",
        marginBottom: 14,
      }}
    >
      <button
        type="button"
        onClick={() => updateSort("latest")}
        style={{
          ...btnStyle,
          background: sort === "latest" ? "#111827" : "#fff",
          color: sort === "latest" ? "#fff" : "#111827",
        }}
      >
        最新
      </button>

      <button
        type="button"
        onClick={() => updateSort("hot")}
        style={{
          ...btnStyle,
          background: sort === "hot" ? "#111827" : "#fff",
          color: sort === "hot" ? "#fff" : "#111827",
        }}
      >
        最热
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  fontWeight: 800,
  cursor: "pointer",
};