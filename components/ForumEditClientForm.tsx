"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MediaItem = {
  type: "IMAGE" | "VIDEO" | "JPEG_SEQUENCE";
  url: string;
};

export default function ForumEditClientForm({
  postId,
  initialTitle,
  initialContent,
  initialCategory,
  initialAgeRating,
  initialPinned,
  initialMediaItems,
}: {
  postId: number;
  initialTitle: string;
  initialContent: string;
  initialCategory: string;
  initialAgeRating: "ALL_AGES" | "AGE_16_PLUS";
  initialPinned: boolean;
  initialMediaItems: MediaItem[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [category, setCategory] = useState(initialCategory || "综合");
  const [ageRating, setAgeRating] = useState<"ALL_AGES" | "AGE_16_PLUS">(initialAgeRating);
  const [isPinned, setIsPinned] = useState(initialPinned);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMediaItems);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function uploadSingleFile(file: File, type: MediaItem["type"]) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/forum/media/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "上传失败");
    }

    setMediaItems((prev) => [...prev, { type, url: data.url }]);
  }

  async function handleUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    type: MediaItem["type"]
  ) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);

    try {
      for (const file of files) {
        await uploadSingleFile(file, type);
      }
    } catch (error: any) {
      alert(error.message || "上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function removeMedia(index: number) {
    setMediaItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim()) {
      alert("标题不能为空");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/forum/admin/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          title,
          content,
          category,
          ageRating,
          isPinned,
          mediaItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "保存失败");
        return;
      }

      router.push(`/forum/${data.postId}`);
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 22,
        padding: 24,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 18 }}>
        编辑论坛帖子
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="帖子标题" style={inputStyle} />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="帖子正文"
          style={{ ...inputStyle, minHeight: 180, resize: "vertical" }}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputStyle}>
          <option value="综合">综合</option>
          <option value="公告">公告</option>
          <option value="资源">资源</option>
          <option value="讨论">讨论</option>
          <option value="资讯">资讯</option>
        </select>

        <select
          value={ageRating}
          onChange={(e) => setAgeRating(e.target.value as any)}
          style={inputStyle}
        >
          <option value="ALL_AGES">全年龄</option>
          <option value="AGE_16_PLUS">不适合未成年观看</option>
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} />
          置顶帖子
        </label>

        <div
          style={{
            padding: 14,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            background: "#f9fafb",
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 800 }}>媒体管理</div>

          <label>
            <div style={uploadBtnStyle}>追加图片</div>
            <input type="file" accept="image/*" multiple hidden onChange={(e) => handleUpload(e, "IMAGE")} />
          </label>

          <label>
            <div style={uploadBtnStyle}>追加视频</div>
            <input type="file" accept="video/*" multiple hidden onChange={(e) => handleUpload(e, "VIDEO")} />
          </label>

          <label>
            <div style={uploadBtnStyle}>追加 JPG 序列</div>
            <input type="file" accept=".jpg,.jpeg,image/jpeg" multiple hidden onChange={(e) => handleUpload(e, "JPEG_SEQUENCE")} />
          </label>

          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {uploading ? "上传中..." : "你可以继续追加媒体，保存时会整体覆盖当前帖子媒体列表。"}
          </div>

          {mediaItems.length > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {mediaItems.map((item, index) => (
                <div
                  key={`${item.url}-${index}`}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 14,
                    padding: 12,
                    background: "#fff",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{item.type}</div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.url}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      border: "1px solid #fecdd3",
                      background: "#fff1f2",
                      color: "#be123c",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || uploading}
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            border: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          {submitting ? "保存中..." : "保存修改"}
        </button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  borderRadius: 14,
  border: "1px solid #d1d5db",
  padding: 14,
  fontSize: 14,
  color: "#111827",
  background: "#fff",
  outline: "none",
};

const uploadBtnStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #d1d5db",
  background: "#fff",
  color: "#111827",
  fontWeight: 800,
  cursor: "pointer",
};