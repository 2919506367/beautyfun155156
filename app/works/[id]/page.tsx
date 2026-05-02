import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CommentForm from "@/components/CommentForm";
import HistoryRecorder from "@/components/HistoryRecorder";
import FavoriteButton from "@/components/FavoriteButton";
import AdminDeleteWorkButton from "@/components/AdminDeleteWorkButton";
import SiteLayout from "@/components/SiteLayout";
import WorkBackButtons from "@/components/WorkBackButtons";
import RecommendationPanel from "@/components/RecommendationPanel";
import ImageLightboxGallery from "@/components/ImageLightboxGallery";
import GifSequencePlayer from "@/components/GifSequencePlayer";
import UserIdentity from "@/components/UserIdentity";
import CommentLikeButton from "@/components/CommentLikeButton";
import FavoriteEmoticonButton from "@/components/FavoriteEmoticonButton";
import { cookies } from "next/headers";

function getRoleStyle(role: "BASIC" | "GOLD" | "ADMIN") {
  if (role === "GOLD") return { color: "#d4af37", label: "黄金会员" };
  if (role === "ADMIN") return { color: "#ff6b6b", label: "管理员" };
  return { color: "var(--bf-panel-text-soft)", label: "普通会员" };
}

function getWorkTypeLabel(type: "FOLDER" | "GIF" | "VIDEO") {
  if (type === "FOLDER") return "图集";
  if (type === "GIF") return "动图（帧序列）";
  return "视频";
}

function getAgeRatingLabel(ageRating: "ALL_AGES" | "AGE_16_PLUS") {
  return ageRating === "AGE_16_PLUS" ? "16+" : "全年龄";
}

function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default async function WorkDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ show16?: string }>;
}) {
  const { id } = await params;
  const workId = Number(id);

  const sp = await searchParams;
  const cookieStore = await cookies();

  const cookieShow16 = cookieStore.get("bf_show16")?.value === "true";
  const show16 =
    typeof sp.show16 === "string" ? sp.show16 === "true" : cookieShow16;

  if (!workId || Number.isNaN(workId)) {
    return (
      <SiteLayout title="作品不存在" active="folders">
        <div style={panelStyle}>作品不存在</div>
      </SiteLayout>
    );
  }

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const work = await prisma.work.findUnique({
    where: { id: workId },
    include: {
      author: true,
      files: {
        orderBy: { sortOrder: "asc" },
      },
      comments: {
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          likes: true,
          emoticon: true,
        },
      },
    },
  });

  if (!work) {
    return (
      <SiteLayout title="作品不存在" active="folders">
        <div style={panelStyle}>作品不存在</div>
      </SiteLayout>
    );
  }

  if (work.ageRating === "AGE_16_PLUS" && !show16) {
    return (
      <SiteLayout title="未开启16+内容显示" active="folders">
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 12, color: "var(--bf-panel-text)" }}>
            未开启16+内容显示
          </h2>
          <div style={{ color: "var(--bf-panel-text-soft)", marginBottom: 20 }}>
            当前作品是 16+ 内容。请先返回列表页并开启 16+ 显示后再查看。
          </div>
          <WorkBackButtons />
        </div>
      </SiteLayout>
    );
  }

  if (work.viewCount >= 99 && user.role === "BASIC") {
    return (
      <SiteLayout title="权限不足" active="folders">
        <div style={panelStyle}>
          <h2 style={{ marginTop: 0, marginBottom: 12, color: "var(--bf-panel-text)" }}>
            权限不足
          </h2>
          <div style={{ color: "var(--bf-panel-text-soft)", marginBottom: 20 }}>
            当前作品属于热门作品，仅黄金会员和管理员可以查看。
          </div>
          <WorkBackButtons />
        </div>
      </SiteLayout>
    );
  }

  const favorite = await prisma.favorite.findFirst({
    where: { userId: user.id, workId: work.id },
    select: { id: true },
  });
  const isFavorited = !!favorite;

  const recommendedWorksRaw = await prisma.work.findMany({
    where: {
      id: { not: work.id },
      type: work.type,
    },
    orderBy: [{ viewCount: "desc" }, { createdAt: "desc" }],
    take: 24,
    include: {
      author: true,
      files: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const recommendedWorks: {
    id: number;
    title: string;
    type: "FOLDER" | "GIF" | "VIDEO";
    coverUrl: string | null;
    authorId: number;
    authorName: string;
    authorRole: "BASIC" | "GOLD" | "ADMIN";
    authorXp: number;
    fileUrl: string | null;
    viewCount: number;
    accessMode: "allow" | "login_required" | "hot_locked";
  }[] = recommendedWorksRaw.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type,
    coverUrl: item.coverUrl,
    authorId: item.author.id,
    authorName: item.author.nickname,
    authorRole: item.author.role,
    authorXp: item.author.xp ?? 0,
    fileUrl: item.files[0]?.fileUrl || null,
    viewCount: item.viewCount,
    accessMode:
      item.viewCount >= 99 && user.role === "BASIC" ? "hot_locked" : "allow",
  }));

  const activeKey =
    work.type === "FOLDER" ? "folders" : work.type === "GIF" ? "gifs" : "videos";

  const imageUrls = work.files.map((f) => f.fileUrl);
  const roleStyle = getRoleStyle(work.author.role);

  return (
    <SiteLayout title={work.title} active={activeKey} hidePageHead>
      <HistoryRecorder workId={work.id} />

<div className="work-detail-layout">
  <div className="work-detail-main">
          <div style={heroPanelStyle}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(circle at 12% 18%, rgba(255,255,255,0.30), transparent 24%), radial-gradient(circle at 82% 14%, rgba(125,170,255,0.18), transparent 28%), radial-gradient(circle at 74% 82%, rgba(255,192,203,0.14), transparent 22%)",
              }}
            />

            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="work-hero-topline">
                <div className="work-hero-pills">
                  <GlassMetaPill>{getWorkTypeLabel(work.type)}</GlassMetaPill>
                  <GlassMetaPill tone={work.ageRating === "AGE_16_PLUS" ? "danger" : "normal"}>
                    {getAgeRatingLabel(work.ageRating)}
                  </GlassMetaPill>
                  <GlassMetaPill>浏览 {work.viewCount}</GlassMetaPill>
                  <GlassMetaPill>{work.files.length} 项内容</GlassMetaPill>
                </div>

                <div className="work-upload-pill">
                  上传时间 · {formatDateTime(work.createdAt)}
                </div>
              </div>

              <h2 className="work-hero-title">{work.title}</h2>

              <div className="work-hero-grid">
                <InfoBlock title="作者信息">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <UserIdentity
                      userId={work.author.id}
                      nickname={work.author.nickname}
                      role={work.author.role}
                      xp={work.author.xp}
                    />

                    <span
                      style={{
                        color: roleStyle.color,
                        fontWeight: 800,
                        fontSize: 13,
                      }}
                    >
                      {roleStyle.label}
                    </span>
                  </div>
                </InfoBlock>

                <InfoBlock title="作品标签">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(work.tags || "")
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                      .map((tag) => (
                        <span
                          key={tag}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "7px 12px",
                            borderRadius: 999,
                            background: "rgba(255,255,255,0.20)",
                            color: "var(--bf-panel-text)",
                            fontSize: 13,
                            fontWeight: 800,
                            border: "1px solid rgba(255,255,255,0.26)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                          }}
                        >
                          #{tag}
                        </span>
                      ))}

                    {!work.tags?.trim() && (
                      <span style={{ fontSize: 13, color: "var(--bf-panel-text-soft)" }}>
                        暂无标签
                      </span>
                    )}
                  </div>
                </InfoBlock>
              </div>

              <div style={{ marginTop: 18 }}>
                <InfoBlock title="操作区">
                  <div className="work-action-row">
                    <WorkBackButtons />
                    <GlassLinkButton href={`/messages/private/share-work/${work.id}`}>
                      转发给好友
                    </GlassLinkButton>
                    <GlassLinkButton href={`/groups/share-work/${work.id}`}>
                      转发到群聊
                    </GlassLinkButton>
                    <FavoriteButton workId={work.id} initialFavorited={isFavorited} />
                    {user.role === "ADMIN" && <AdminDeleteWorkButton workId={work.id} />}
                  </div>
                </InfoBlock>
              </div>
            </div>
          </div>

          <div style={{ ...panelStyle, marginTop: 22 }}>
            <div className="work-section-head">
              <h3 style={sectionTitle}>作品内容</h3>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <SmallPill text="沉浸式浏览" />
                <SmallPill text="丝滑预览" />
                <SmallPill
                  text={
                    work.type === "VIDEO"
                      ? "视频模式"
                      : work.type === "GIF"
                      ? "帧序列模式"
                      : "图集模式"
                  }
                />
              </div>
            </div>

            {work.type === "FOLDER" && (
              <div>
                <ImageLightboxGallery images={imageUrls} title={work.title} />
                <div style={{ marginTop: 20 }}>
                  <WorkBackButtons />
                </div>
              </div>
            )}

            {work.type === "GIF" && (
              <div>
                <GifSequencePlayer frames={imageUrls} title={work.title} />
                <div style={{ marginTop: 20 }}>
                  <WorkBackButtons />
                </div>
              </div>
            )}

            {work.type === "VIDEO" && (
              <div>
                <div style={mediaFrameStyle}>
                  <video
                    src={work.files[0]?.fileUrl}
                    controls
                    preload="metadata"
                    style={{
                      width: "100%",
                      borderRadius: 20,
                      display: "block",
                      background: "#000",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
                    }}
                  />
                </div>

                <div style={{ marginTop: 20 }}>
                  <WorkBackButtons />
                </div>
              </div>
            )}
          </div>

          <div style={{ ...panelStyle, marginTop: 24 }}>
            <div className="work-section-head">
              <h3 style={sectionTitle}>评论区</h3>

              <div
                style={{
                  fontSize: 13,
                  color: "var(--bf-panel-text-soft)",
                  fontWeight: 800,
                }}
              >
                共 {work.comments.length} 条评论
              </div>
            </div>

            <CommentForm workId={work.id} />

            {work.comments.length === 0 ? (
              <div style={{ color: "var(--bf-panel-text-soft)", paddingTop: 6 }}>
                还没有评论
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {work.comments.map((comment) => (
                  <div key={comment.id} className="work-comment-card">
                    <div className="work-comment-head">
                      <UserIdentity
                        userId={comment.user.id}
                        nickname={comment.user.nickname}
                        role={comment.user.role}
                        xp={comment.user.xp}
                      />

                      <CommentLikeButton
                        commentId={comment.id}
                        initialLikeCount={comment.likes.length}
                      />
                    </div>

                    <div className="work-comment-content">{comment.content}</div>

                    {comment.emoticon && (
                      <div className="work-comment-emoticon-block">
                        <img
                          src={comment.emoticon.imageUrl}
                          alt={comment.emoticon.label || "表情包"}
                          className="work-comment-emoticon-image"
                        />

                        <div className="work-comment-emoticon-action">
                          <FavoriteEmoticonButton emoticonId={comment.emoticon.id} />
                        </div>
                      </div>
                    )}

                    <div style={{ fontSize: 12, color: "var(--bf-panel-text-soft)" }}>
                      评论时间：{formatDateTime(comment.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

<div className="work-detail-side">
  <div className="work-detail-side-inner">
    <RecommendationPanel items={recommendedWorks} />
  </div>
</div>
      </div>
    </SiteLayout>
  );
}

function GlassMetaPill({
  children,
  tone = "normal",
}: {
  children: React.ReactNode;
  tone?: "normal" | "danger";
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "8px 12px",
        borderRadius: 999,
        background:
          tone === "danger"
            ? "rgba(190,24,93,0.14)"
            : "rgba(255,255,255,0.20)",
        color: tone === "danger" ? "#be123c" : "var(--bf-panel-text)",
        fontWeight: 800,
        fontSize: 13,
        border:
          tone === "danger"
            ? "1px solid rgba(190,24,93,0.18)"
            : "1px solid rgba(255,255,255,0.26)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
      }}
    >
      {children}
    </span>
  );
}

function InfoBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 22,
        background: "rgba(255,255,255,0.16)",
        border: "1px solid rgba(255,255,255,0.24)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{
          marginBottom: 10,
          fontSize: 12,
          color: "var(--bf-panel-text-soft)",
          fontWeight: 900,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function GlassLinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{
        padding: "10px 16px",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.30)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.76), rgba(255,255,255,0.26)), rgba(255,255,255,0.22)",
        color: "var(--bf-panel-text)",
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.22), 0 10px 24px rgba(15,23,42,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {children}
    </Link>
  );
}

function SmallPill({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "8px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color: "var(--bf-panel-text)",
        background: "rgba(255,255,255,0.20)",
        border: "1px solid rgba(255,255,255,0.28)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      {text}
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "var(--bf-panel-bg)",
  border: "1px solid var(--bf-panel-border)",
  borderRadius: 28,
  padding: 24,
  boxShadow: "var(--bf-shadow-md)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
  position: "relative",
  overflow: "hidden",
};

const heroPanelStyle: React.CSSProperties = {
  ...panelStyle,
  minHeight: 280,
};

const mediaFrameStyle: React.CSSProperties = {
  borderRadius: 28,
  padding: 14,
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.20)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
};

const sectionTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 900,
  color: "var(--bf-panel-text)",
  letterSpacing: "-0.03em",
};