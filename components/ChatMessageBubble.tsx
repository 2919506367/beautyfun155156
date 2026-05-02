"use client";

import Link from "next/link";

type EmoticonPreview = {
  id: number;
  label: string | null;
  imageUrl: string;
};

type SharedWorkPreview = {
  id: number;
  title: string;
  type: "FOLDER" | "GIF" | "VIDEO";
  coverUrl?: string | null;
  ageRating?: "ALL_AGES" | "AGE_16_PLUS" | null;
  createdAt?: string;
  author?: {
    id: number;
    nickname: string;
    role: "BASIC" | "GOLD" | "ADMIN";
    xp: number | null;
  } | null;
  files?: Array<{
    fileUrl: string;
  }>;
} | null;

function getWorkTypeLabel(type: "FOLDER" | "GIF" | "VIDEO") {
  if (type === "FOLDER") return "图集";
  if (type === "GIF") return "动图";
  return "视频";
}

function getWorkCover(sharedWork: NonNullable<SharedWorkPreview>) {
  return sharedWork.coverUrl || sharedWork.files?.[0]?.fileUrl || "";
}

function isEmojiOnlyContent(text: string) {
  const compact = text.trim().replace(/\s+/g, "");

  if (!compact) return false;
  if (Array.from(compact).length > 12) return false;

  return /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\uFE0F\u200D]+$/u.test(compact);
}

export default function ChatMessageBubble({
  isMine,
  senderLabel,
  content,
  timeText,
  isDeleted,
  readAt,
  editedAt,
  mentionText,
  emoticon,
  replyPreview,
  sharedWork,
  onContextMenu,
}: {
  isMine: boolean;
  senderLabel: string;
  content: string;
  timeText: string;
  isDeleted?: boolean;
  readAt?: string | null;
  editedAt?: string | null;
  mentionText?: string | null;
  emoticon?: EmoticonPreview | null;
  replyPreview?: {
    senderLabel: string;
    content: string;
    emoticon?: EmoticonPreview | null;
  } | null;
  sharedWork?: SharedWorkPreview;
  onContextMenu?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const hasText = !!content?.trim();
  const hasEmoticon = !!emoticon && !isDeleted;
  const hasSharedWork = !!sharedWork && !isDeleted;
  const isEmojiOnly = hasText && !isDeleted && isEmojiOnlyContent(content);
  const statusText = isMine ? (readAt ? "已读" : "已送达") : "";

  return (
    <div
      onContextMenu={onContextMenu}
      className={`chat-message-piece ${
        isMine ? "chat-message-piece-mine" : "chat-message-piece-other"
      }`}
      title="右键打开操作菜单"
    >
      <div
        className={`chat-message-sender-line ${
          isMine ? "chat-message-sender-line-mine" : "chat-message-sender-line-other"
        }`}
      >
        {senderLabel}
      </div>

      <div
        className={`chat-message-body-card ${
          isMine ? "chat-message-body-card-mine" : "chat-message-body-card-other"
        }`}
      >
        {replyPreview && (
          <div className="chat-message-reply-preview">
            <div className="chat-message-reply-title">
              回复 {replyPreview.senderLabel}
            </div>

            {!!replyPreview.content && (
              <div className="chat-message-reply-content">
                {replyPreview.content}
              </div>
            )}

            {replyPreview.emoticon && (
              <img
                src={replyPreview.emoticon.imageUrl}
                alt={replyPreview.emoticon.label || "表情包"}
                className="chat-message-reply-emoticon"
              />
            )}
          </div>
        )}

        {mentionText && (
          <div className="chat-message-mention-badge">@{mentionText}</div>
        )}

        {hasText && (
          <div
            className={`chat-message-content ${
              isDeleted ? "chat-message-content-deleted" : ""
            } ${isEmojiOnly ? "chat-message-content-emoji-only" : ""}`}
          >
            {content}
          </div>
        )}

        {hasSharedWork && sharedWork && (
          <Link
            href={`/works/${sharedWork.id}`}
            className="chat-shared-work-card"
            style={{
              display: "block",
              marginTop: hasText ? 10 : 0,
              textDecoration: "none",
              color: "inherit",
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid rgba(148,163,184,0.28)",
              background: "rgba(255,255,255,0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: "0 10px 26px rgba(15,23,42,0.08)",
            }}
          >
            {getWorkCover(sharedWork) ? (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  overflow: "hidden",
                  background: "rgba(241,245,249,0.9)",
                }}
              >
                <img
                  src={getWorkCover(sharedWork)}
                  alt={sharedWork.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            ) : null}

            <div style={{ padding: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "rgba(59,130,246,0.12)",
                    color: "#1d4ed8",
                  }}
                >
                  作品分享
                </span>

                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "4px 8px",
                    borderRadius: 999,
                    background: "rgba(15,23,42,0.06)",
                    color: "#334155",
                  }}
                >
                  {getWorkTypeLabel(sharedWork.type)}
                </span>

                {sharedWork.ageRating ? (
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: 999,
                      background:
                        sharedWork.ageRating === "AGE_16_PLUS"
                          ? "rgba(239,68,68,0.12)"
                          : "rgba(34,197,94,0.12)",
                      color:
                        sharedWork.ageRating === "AGE_16_PLUS" ? "#b91c1c" : "#166534",
                    }}
                  >
                    {sharedWork.ageRating === "AGE_16_PLUS" ? "16+" : "全年龄"}
                  </span>
                ) : null}
              </div>

              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  lineHeight: 1.45,
                  color: "#0f172a",
                  marginBottom: 6,
                  wordBreak: "break-word",
                }}
              >
                {sharedWork.title}
              </div>

              {sharedWork.author?.nickname ? (
                <div
                  style={{
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  作者：{sharedWork.author.nickname}
                </div>
              ) : null}
            </div>
          </Link>
        )}

        {hasEmoticon && (
          <div className="chat-message-emoticon-wrap">
            <img
              src={emoticon.imageUrl}
              alt={emoticon.label || "表情包"}
              className="chat-message-emoticon"
            />
          </div>
        )}
      </div>

      <div
        className={`chat-message-time-line ${
          isMine ? "chat-message-time-line-mine" : "chat-message-time-line-other"
        }`}
      >
        <span>{timeText}</span>
        {editedAt ? <span>已编辑</span> : null}
        {statusText ? <span>{statusText}</span> : null}
      </div>
    </div>
  );
}
