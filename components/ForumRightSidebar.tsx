import Link from "next/link";

export default function ForumRightSidebar({
  privateChats,
  groups,
}: {
  privateChats: {
    userId: number;
    nickname: string;
    account: string;
  }[];
  groups: {
    id: number;
    name: string;
    memberCount: number;
  }[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: 16,
        position: "sticky",
        top: 88,
      }}
    >
      <div style={cardStyle}>
        <div style={titleStyle}>好友列表</div>

        {privateChats.length === 0 ? (
          <div style={emptyStyle}>还没有最近私聊对象</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {privateChats.map((item) => (
              <Link
                key={item.userId}
                href={`/chats?kind=private&id=${item.userId}`}
                style={itemStyle}
              >
                <div style={{ fontWeight: 800, color: "var(--bf-panel-text)" }}>{item.nickname}</div>
                <div style={{ fontSize: 12, color: "var(--bf-panel-text-soft)" }}>账号：{item.account}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={titleStyle}>群聊列表</div>

        {groups.length === 0 ? (
          <div style={emptyStyle}>还没有群聊</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/chats?kind=group&id=${group.id}`}
                style={itemStyle}
              >
                <div style={{ fontWeight: 800, color: "var(--bf-panel-text)" }}>{group.name}</div>
                <div style={{ fontSize: 12, color: "var(--bf-panel-text-soft)" }}>
                  {group.memberCount} 位成员
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--bf-panel-bg)",
  border: "1px solid var(--bf-panel-border)",
  borderRadius: 24,
  padding: 16,
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "var(--bf-panel-text)",
  marginBottom: 12,
};

const itemStyle: React.CSSProperties = {
  display: "block",
  textDecoration: "none",
  color: "inherit",
  borderRadius: 14,
  padding: "10px 12px",
  background: "var(--bf-panel-bg-soft)",
};

const emptyStyle: React.CSSProperties = {
  fontSize: 13,
  color: "var(--bf-panel-text-soft)",
};