export default function ForumCommentContent({
  content,
  isHidden,
  editedAt,
}: {
  content: string;
  isHidden: boolean;
  editedAt?: string | null;
}) {
  if (isHidden) {
    return (
      <div
        style={{
          fontSize: 14,
          color: "#9ca3af",
          fontStyle: "italic",
          lineHeight: 1.9,
        }}
      >
        该评论已被管理员屏蔽
      </div>
    );
  }

  const parts = content.split(/(@[^\s@]+)/g);

  return (
    <div
      style={{
        fontSize: 14,
        color: "#374151",
        lineHeight: 1.9,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}
    >
      {parts.map((part, index) => {
        if (part.startsWith("@")) {
          return (
            <span
              key={index}
              style={{
                color: "#2563eb",
                fontWeight: 800,
              }}
            >
              {part}
            </span>
          );
        }

        return <span key={index}>{part}</span>;
      })}

      {editedAt ? (
        <span
          style={{
            marginLeft: 8,
            fontSize: 12,
            color: "#9ca3af",
          }}
        >
          （已编辑）
        </span>
      ) : null}
    </div>
  );
}