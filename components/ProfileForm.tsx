"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProfileForm({
  currentNickname,
}: {
  currentNickname: string;
  currentAvatarUrl: string;
}) {
  const router = useRouter();
  const [nickname, setNickname] = useState(currentNickname);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("nickname", nickname);
      if (avatar) formData.append("avatar", avatar);

      const res = await fetch("/api/profile/update", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "保存失败");
        setLoading(false);
        return;
      }

      alert(data.message || "保存成功");
      router.refresh();
    } catch {
      alert("请求失败，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ marginBottom: 18 }}>
        <div style={labelStyle}>修改昵称</div>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          style={inputStyle}
          placeholder="请输入新昵称"
        />
      </div>

      <div style={{ marginBottom: 22 }}>
        <div style={labelStyle}>上传头像</div>
        <div
          style={{
            border: "1px dashed #d1d5db",
            borderRadius: 18,
            background: "#f9fafb",
            padding: 18,
          }}
        >
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files?.[0] || null)}
          />

          <div style={{ marginTop: 10, fontSize: 13, color: "#6b7280" }}>
            建议上传清晰的正方形头像图片
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={loading}
        style={{
          padding: "12px 18px",
          borderRadius: 14,
          border: "none",
          background: "#111827",
          color: "#fff",
          cursor: "pointer",
          fontWeight: 800,
          fontSize: 14,
          boxShadow: "0 10px 22px rgba(17,24,39,0.12)",
        }}
      >
        {loading ? "保存中..." : "保存资料"}
      </button>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  marginBottom: 8,
  fontSize: 14,
  color: "#374151",
  fontWeight: 800,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 16,
  border: "1px solid #d1d5db",
  color: "#111",
  background: "#fff",
  fontSize: 14,
};