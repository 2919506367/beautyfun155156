"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type EmoticonItem = {
  id: number;
  label: string | null;
  imageUrl: string;
  createdAt: string;
};

export default function EmoticonManager({
  initialItems,
}: {
  initialItems: EmoticonItem[];
}) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!file || loading) {
      alert("请选择一张表情包图片");
      return;
    }

    setLoading(true);

    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);

      const uploadRes = await fetch("/api/emoticons/upload", {
        method: "POST",
        body: uploadForm,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        alert(uploadData.error || "上传图片失败");
        return;
      }

      const createRes = await fetch("/api/emoticons/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: label.trim(),
          imageUrl: uploadData.imageUrl,
        }),
      });

      const createData = await createRes.json();

      if (!createRes.ok) {
        alert(createData.error || "添加失败");
        return;
      }

      setLabel("");
      setFile(null);
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={panelStyle}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: "#111827" }}>我的表情包</h2>
        <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>
          现在支持直接上传本地表情包图片，支持 png、jpg、jpeg、webp、gif，单张不超过 5MB。
        </div>
      </div>

      <div style={{ display: "grid", gap: 12, marginBottom: 20 }}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="表情包名称（可选）"
          style={inputStyle}
        />

        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
          onChange={(e) => {
            const nextFile = e.target.files?.[0] || null;
            setFile(nextFile);
          }}
          style={inputStyle}
        />

        {file && (
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            已选择：{file.name}
          </div>
        )}

        <button
          type="button"
          onClick={handleCreate}
          disabled={loading}
          style={btnStyle}
        >
          {loading ? "上传并添加中..." : "上传表情包"}
        </button>
      </div>

      {initialItems.length === 0 ? (
        <div style={{ color: "#6b7280" }}>你还没有添加任何表情包。</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 16,
          }}
        >
          {initialItems.map((item) => (
            <div key={item.id} style={cardStyle}>
              <img
                src={item.imageUrl}
                alt={item.label || "表情包"}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  borderRadius: 12,
                  display: "block",
                  marginBottom: 10,
                }}
              />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#111827", marginBottom: 4 }}>
                {item.label || `表情包 ${item.id}`}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {new Date(item.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 22,
  padding: 24,
};

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
  padding: "10px 16px",
  borderRadius: 12,
  border: "none",
  background: "#111827",
  color: "#fff",
  fontWeight: 800,
  cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 12,
};