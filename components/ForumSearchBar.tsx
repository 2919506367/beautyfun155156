import React from "react";

const CATEGORY_OPTIONS = ["全部", "综合", "公告", "资源", "讨论", "资讯"];

export default function ForumSearchBar({
  initialQ = "",
  initialCategory = "全部",
}: {
  initialQ?: string;
  initialCategory?: string;
}) {
  return (
    <div
      style={{
background: "var(--bf-panel-bg)",
border: "1px solid var(--bf-panel-border)",
        borderRadius: 24,
        padding: 14,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 170px auto",
        gap: 10,
        alignItems: "center",
      }}
    >
      <form
        action="/forum"
        method="get"
        style={{
          display: "contents",
        }}
      >
        <input
          type="text"
          name="q"
          defaultValue={initialQ}
          placeholder="搜索帖子标题 / 正文"
          style={inputStyle}
        />

        <select
          name="category"
          defaultValue={initialCategory}
          style={inputStyle}
        >
          {CATEGORY_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button type="submit" style={submitStyle}>
          搜索
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 999,
  border: "1px solid #e5e7eb",
  padding: "12px 16px",
  fontSize: 14,
  color: "#111827",
  background: "#f8fafc",
  outline: "none",
};

const submitStyle: React.CSSProperties = {
  padding: "11px 16px",
  borderRadius: 999,
  border: "none",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
  whiteSpace: "nowrap",
};