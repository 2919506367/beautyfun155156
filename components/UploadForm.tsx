"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"FOLDER" | "GIF" | "VIDEO">("FOLDER");
  const [tags, setTags] = useState("");
  const [ageRating, setAgeRating] = useState<"ALL_AGES" | "AGE_16_PLUS">("ALL_AGES");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) {
      alert("标题不能为空");
      return;
    }

    if (!files || files.length === 0) {
      alert("请先选择文件");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("type", type);
      formData.append("tags", tags.trim());
      formData.append("ageRating", ageRating);

      Array.from(files).forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "上传失败");
        return;
      }

      alert("上传成功");
      setTitle("");
      setTags("");
      setAgeRating("ALL_AGES");
      setFiles(null);
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="作品标题"
        style={inputStyle}
      />

      <select
        value={type}
        onChange={(e) => setType(e.target.value as "FOLDER" | "GIF" | "VIDEO")}
        style={inputStyle}
      >
        <option value="FOLDER">图集</option>
        <option value="GIF">动图</option>
        <option value="VIDEO">视频</option>
      </select>

      <input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="作品标签，多个标签用逗号分隔，例如：二次元,风景,写真"
        style={inputStyle}
      />

      <select
        value={ageRating}
        onChange={(e) => setAgeRating(e.target.value as "ALL_AGES" | "AGE_16_PLUS")}
        style={inputStyle}
      >
        <option value="ALL_AGES">全年龄</option>
        <option value="AGE_16_PLUS">16+</option>
      </select>

      <input
        type="file"
        multiple={type !== "VIDEO"}
        accept={type === "VIDEO" ? "video/*" : "image/*"}
        onChange={(e) => setFiles(e.target.files)}
        style={inputStyle}
      />

      {files && files.length > 0 && (
        <div style={{ fontSize: 13, color: "#6b7280" }}>
          已选择 {files.length} 个文件
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        style={btnStyle}
      >
        {loading ? "上传中..." : "上传作品"}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  padding: "12px 14px",
  fontSize: 14,
  color: "#111827",
  background: "#fff",
  outline: "none",
};

const btnStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};