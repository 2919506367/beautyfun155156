"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MediaItem = {
  type: "IMAGE" | "VIDEO" | "JPEG_SEQUENCE";
  url: string;
};

export default function ForumCreateClientForm() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [ageRating, setAgeRating] = useState<"ALL_AGES" | "AGE_16_PLUS">("ALL_AGES");
  const [isPinned, setIsPinned] = useState(false);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
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

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        await uploadSingleFile(file, "IMAGE");
      }
    } catch (error: any) {
      alert(error.message || "图片上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        await uploadSingleFile(file, "VIDEO");
      }
    } catch (error: any) {
      alert(error.message || "视频上传失败");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSequenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      for (const file of files) {
        await uploadSingleFile(file, "JPEG_SEQUENCE");
      }
    } catch (error: any) {
      alert(error.message || "JPG序列上传失败");
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
      const res = await fetch("/api/forum/create-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          ageRating,
          isPinned,
          mediaItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "发布失败");
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
        发布论坛帖子
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="帖子标题"
          style={inputStyle}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="帖子正文"
          style={{ ...inputStyle, minHeight: 180, resize: "vertical" }}
        />

        <select
          value={ageRating}
          onChange={(e) => setAgeRating(e.target.value as any)}
          style={inputStyle}
        >
          <option value="ALL_AGES">全年龄</option>
          <option value="AGE_16_PLUS">不适合未成年观看</option>
        </select>

        <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
          />
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
          <div style={{ fontWeight: 800 }}>上传媒体</div>

          <label>
            <div style={uploadBtnStyle}>上传图片</div>
            <input type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
          </label>

          <label>
            <div style={uploadBtnStyle}>上传视频</div>
            <input type="file" accept="video/*" multiple hidden onChange={handleVideoUpload} />
          </label>

          <label>
            <div style={uploadBtnStyle}>上传 JPG 序列</div>
            <input type="file" accept=".jpg,.jpeg,image/jpeg" multiple hidden onChange={handleSequenceUpload} />
          </label>

          <div style={{ fontSize: 13, color: "#6b7280" }}>
            {uploading ? "上传中..." : "论坛媒体独立保存，不会进入作品区。"}
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
          {submitting ? "发布中..." : "发布帖子"}
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