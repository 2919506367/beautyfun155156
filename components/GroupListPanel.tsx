import Link from "next/link";

type GroupItem = {
  id: number;
  name: string;
  createdAt: string;
  memberCount: number;
};

export default function GroupListPanel({
  groups,
}: {
  groups: GroupItem[];
}) {
  return (
    <div style={panelStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18,
        }}
      >
        <div>
          <h2 style={{ margin: 0, color: "#111827" }}>我的群聊</h2>
          <div style={{ marginTop: 6, fontSize: 14, color: "#6b7280" }}>
            这里显示你加入的群聊
          </div>
        </div>

        <Link href="/groups/create" style={linkBtnStyle}>
          创建群聊
        </Link>
      </div>

      {groups.length === 0 ? (
        <div style={{ color: "#6b7280" }}>你暂时还没有加入任何群聊。</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {groups.map((item) => (
            <Link
              key={item.id}
              href={`/chats?kind=group&id=${item.id}`}
              style={cardStyle}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color: "#111827", marginBottom: 6 }}>
                {item.name}
              </div>
              <div style={{ fontSize: 14, color: "#374151", marginBottom: 4 }}>
                群成员：{item.memberCount} 人
              </div>
              <div style={{ fontSize: 13, color: "#6b7280" }}>
                创建时间：{new Date(item.createdAt).toLocaleString()}
              </div>
            </Link>
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
  marginTop: 24,
};

const linkBtnStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  background: "#111827",
  color: "#fff",
  textDecoration: "none",
  display: "inline-block",
  fontWeight: 700,
};

const cardStyle: React.CSSProperties = {
  display: "block",
  background: "#f9fafb",
  border: "1px solid #e5e7eb",
  borderRadius: 18,
  padding: 16,
  textDecoration: "none",
  color: "inherit",
};