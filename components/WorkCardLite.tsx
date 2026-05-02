"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import VideoFrameCover from "@/components/VideoFrameCover";
import { saveCurrentListPosition } from "@/components/ListPageMemory";
import UserIdentity from "@/components/UserIdentity";

type WorkType = "FOLDER" | "GIF" | "VIDEO";
type AccessMode = "allow" | "login_required" | "hot_locked" | "age_locked";
type UserRoleType = "BASIC" | "GOLD" | "ADMIN";

function getWorkTypeLabel(type: WorkType) {
  if (type === "FOLDER") return "图集";
  if (type === "GIF") return "动图";
  return "视频";
}

function formatViewCount(viewCount: number) {
  if (viewCount >= 99) return "99+";
  return String(viewCount);
}

export default function WorkCardLite({
  href,
  title,
  type,
  authorId,
  authorName,
  authorRole = "BASIC",
  authorXp = 0,
  pageCount,
  timeLabel,
  timeValue,
  cover,
  viewCount = 0,
  tags = "",
  ageRating = "ALL_AGES",
  blurCover = false,
  accessMode = "allow",
  previewFrames = [],
}: {
  href: string;
  title: string;
  type: WorkType;
  authorId?: number | string;
  authorName: string;
  authorRole?: UserRoleType;
  authorXp?: number | null;
  pageCount?: number;
  timeLabel: string;
  timeValue: string;
  cover: string;
  viewCount?: number;
  tags?: string;
  ageRating?: "ALL_AGES" | "AGE_16_PLUS";
  blurCover?: boolean;
  accessMode?: AccessMode;
  previewFrames?: string[];
}) {
  const router = useRouter();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showBlockedModal, setShowBlockedModal] = useState(false);

  const shareWorkId = useMemo(
    () => href.replace("/works/", "").replace("?show16=true", ""),
    [href]
  );

  function handleClick(e: React.MouseEvent) {
    if (accessMode === "allow") {
      saveCurrentListPosition();
      return;
    }

    e.preventDefault();

    if (accessMode === "login_required") {
      setShowLoginModal(true);
      return;
    }

    if (accessMode === "hot_locked" || accessMode === "age_locked") {
      setShowBlockedModal(true);
      return;
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -7, scale: 1.012 }}
        whileTap={{ scale: 0.992 }}
        style={{
          borderRadius: 26,
          overflow: "hidden",
          background: "var(--bf-panel-bg)",
          border: "1px solid var(--bf-panel-border)",
          boxShadow: "var(--bf-shadow-md)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04)), radial-gradient(circle at top left, rgba(255,255,255,0.22), transparent 34%)",
          }}
        />

        <Link
          href={href}
          onClick={handleClick}
          style={{
            display: "block",
            textDecoration: "none",
            color: "var(--bf-panel-text)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              background: "rgba(255,255,255,0.16)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {type === "VIDEO" ? (
              <motion.div
                style={{
                  width: "100%",
                  height: "100%",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: blurCover ? "blur(22px)" : "none",
                    transform: blurCover ? "scale(1.14)" : "none",
                    transition: "filter 0.28s ease, transform 0.28s ease",
                  }}
                >
                  <VideoFrameCover src={cover} alt={title} />
                </motion.div>
              </motion.div>
            ) : cover ? (
              <AnimatedImageCover
                src={cover}
                alt={title}
                frames={type === "GIF" ? previewFrames : []}
                blurCover={blurCover}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--bf-panel-text-soft)",
                  fontSize: 14,
                }}
              >
                暂无封面
              </div>
            )}

            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.00) 0%, rgba(15,23,42,0.04) 56%, rgba(15,23,42,0.14) 100%)",
              }}
            />

            {blurCover && (
              <>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to bottom, rgba(17,24,39,0.24), rgba(17,24,39,0.42))",
                    zIndex: 1,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 3,
                    pointerEvents: "none",
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 16px",
                      borderRadius: 999,
                      background: "rgba(17,24,39,0.72)",
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 800,
                      letterSpacing: 0.2,
                      backdropFilter: "blur(12px)",
                      WebkitBackdropFilter: "blur(12px)",
                      boxShadow: "0 12px 28px rgba(0,0,0,0.24)",
                    }}
                  >
                    18+ 内容已隐藏
                  </div>
                </div>
              </>
            )}

            <GlassBadge position="left" top={12}>
              {getWorkTypeLabel(type)}
            </GlassBadge>

            <GlassBadge position="right" top={12}>
              👁 {formatViewCount(viewCount)}
            </GlassBadge>

            <GlassBadge position="right" bottom={12} tone={ageRating === "AGE_16_PLUS" ? "danger" : "normal"}>
              {ageRating === "AGE_16_PLUS" ? "18+" : "全年龄"}
            </GlassBadge>
          </div>

          <div style={{ padding: 16 }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 850,
                color: "var(--bf-panel-text)",
                lineHeight: 1.45,
                marginBottom: 10,
                wordBreak: "break-word",
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>

            {tags.trim() && (
              <div
                style={{
                  display: "flex",
                  gap: 7,
                  flexWrap: "wrap",
                  marginBottom: 12,
                }}
              >
                {tags
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 12,
                        padding: "6px 10px",
                        borderRadius: 999,
                        background: "rgba(255,255,255,0.20)",
                        border: "1px solid rgba(255,255,255,0.28)",
                        color: "var(--bf-panel-text)",
                        fontWeight: 800,
                        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <UserIdentity
                userId={authorId}
                nickname={authorName}
                role={authorRole}
                xp={authorXp}
                size="sm"
                linkToProfile={false}
              />
            </div>

            <div
              style={{
                display: "grid",
                gap: 8,
              }}
            >
              {typeof pageCount === "number" && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--bf-panel-text-soft)",
                    fontWeight: 700,
                  }}
                >
                  共 {pageCount} P
                </div>
              )}

              <div
                style={{
                  fontSize: 13,
                  color: "var(--bf-panel-text-soft)",
                  lineHeight: 1.7,
                }}
              >
                {timeLabel}：{timeValue}
              </div>
            </div>
          </div>
        </Link>

        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.22)",
            padding: "12px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            background: "rgba(255,255,255,0.10)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "var(--bf-panel-text-soft)",
              fontWeight: 700,
            }}
          >
            快速操作
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <ActionLink href={`/messages/private/share-work/${shareWorkId}`}>
              转发好友
            </ActionLink>

            <ActionLink href={`/groups/share-work/${shareWorkId}`}>
              转发群聊
            </ActionLink>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showLoginModal && (
          <ModalBackdrop onClose={() => setShowLoginModal(false)}>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={modalStyle}
            >
              <div style={modalTitleStyle}>请先登录后查看作品</div>
              <div style={modalTextStyle}>当前未登录，无法进入作品详情页浏览。</div>

              <div style={modalBtnRowStyle}>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  style={cancelBtnStyle}
                >
                  取消
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  style={confirmBtnStyle}
                >
                  登录
                </button>
              </div>
            </motion.div>
          </ModalBackdrop>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showBlockedModal && (
          <ModalBackdrop onClose={() => setShowBlockedModal(false)}>
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={modalStyle}
            >
              <div style={modalTitleStyle}>
                {accessMode === "age_locked" ? "未开启18+内容显示" : "权限不足"}
              </div>

              <div style={modalTextStyle}>
                {accessMode === "age_locked"
                  ? "当前作品是 18+ 内容。请先在当前分区打开 18+ 显示后再进入详情页。"
                  : "当前作品属于热门作品，仅黄金会员和管理员可以查看。"}
              </div>

              <div style={modalBtnRowStyle}>
                <button
                  type="button"
                  onClick={() => setShowBlockedModal(false)}
                  style={confirmBtnStyle}
                >
                  知道了
                </button>
              </div>
            </motion.div>
          </ModalBackdrop>
        )}
      </AnimatePresence>
    </>
  );
}

function ActionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={(e) => e.stopPropagation()}
      style={{
        padding: "8px 12px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.28)",
        background: "rgba(255,255,255,0.16)",
        color: "var(--bf-panel-text)",
        textDecoration: "none",
        display: "inline-block",
        fontWeight: 800,
        fontSize: 13,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      {children}
    </Link>
  );
}

function GlassBadge({
  children,
  position,
  top,
  bottom,
  tone = "normal",
}: {
  children: React.ReactNode;
  position: "left" | "right";
  top?: number;
  bottom?: number;
  tone?: "normal" | "danger";
}) {
  return (
    <div
      style={{
        position: "absolute",
        ...(position === "left" ? { left: 12 } : { right: 12 }),
        ...(typeof top === "number" ? { top } : {}),
        ...(typeof bottom === "number" ? { bottom } : {}),
        padding: "7px 11px",
        borderRadius: 999,
        background:
          tone === "danger"
            ? "rgba(190,24,93,0.78)"
            : "rgba(17,24,39,0.56)",
        color: "#fff",
        fontSize: 12,
        fontWeight: 800,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        zIndex: 4,
        border: "1px solid rgba(255,255,255,0.16)",
        boxShadow: "0 8px 22px rgba(0,0,0,0.16)",
      }}
    >
      {children}
    </div>
  );
}

function ModalBackdrop({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = oldOverflow;
    };
  }, []);

  const backdrop = (
    <motion.div
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100dvh",
        background: "rgba(10,14,25,0.42)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display: "grid",
        placeItems: "center",
        zIndex: 2147483000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(440px, calc(100vw - 40px))",
          maxHeight: "calc(100dvh - 40px)",
          overflow: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {children}
      </div>
    </motion.div>
  );

  if (!mounted) return null;

  return createPortal(backdrop, document.body);
}

function AnimatedImageCover({
  src,
  alt,
  frames,
  blurCover,
}: {
  src: string;
  alt: string;
  frames: string[];
  blurCover: boolean;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const safeFrames = useMemo(
    () => frames.filter((frame) => typeof frame === "string" && frame.trim().length > 0),
    [frames]
  );
  const initialSrc = safeFrames.length > 0 ? safeFrames[0] : src;

  useEffect(() => {
    if (safeFrames.length <= 1) {
      if (imgRef.current) imgRef.current.src = initialSrc;
      return;
    }

    let index = 0;
    const previewFrames = safeFrames.slice(0, 36);

    for (const frame of previewFrames.slice(0, 12)) {
      const image = new Image();
      image.src = frame;
    }

    if (imgRef.current) imgRef.current.src = previewFrames[0];

    const interval = previewFrames.length <= 12 ? 140 : previewFrames.length <= 24 ? 110 : 90;
    const timer = window.setInterval(() => {
      index = (index + 1) % previewFrames.length;
      if (imgRef.current) {
        imgRef.current.src = previewFrames[index];
      }
    }, interval);

    return () => window.clearInterval(timer);
  }, [initialSrc, safeFrames]);

  return (
    <motion.div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <motion.img
        ref={imgRef}
        src={initialSrc}
        alt={alt}
        loading="lazy"
        whileHover={{ scale: 1.06 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          filter: blurCover ? "blur(22px)" : "none",
          transform: blurCover ? "scale(1.14)" : "none",
          transition: "filter 0.28s ease, transform 0.28s ease",
        }}
      />
    </motion.div>
  );
}
const modalStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 440,
  background: "var(--bf-panel-bg-strong)",
  borderRadius: 28,
  padding: 24,
  boxShadow: "0 30px 80px rgba(0,0,0,0.24)",
  border: "1px solid var(--bf-panel-border)",
  backdropFilter: "blur(22px)",
  WebkitBackdropFilter: "blur(22px)",
};

const modalTitleStyle: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 900,
  color: "var(--bf-panel-text)",
  marginBottom: 12,
  letterSpacing: "-0.03em",
};

const modalTextStyle: React.CSSProperties = {
  fontSize: 14,
  color: "var(--bf-panel-text-soft)",
  lineHeight: 1.8,
};

const modalBtnRowStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: 12,
  marginTop: 22,
};

const cancelBtnStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.28)",
  background: "rgba(255,255,255,0.16)",
  color: "var(--bf-panel-text)",
  borderRadius: 14,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 800,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
};

const confirmBtnStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.36)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.38)), rgba(255,255,255,0.36)",
  color: "#0f172a",
  borderRadius: 14,
  padding: "10px 16px",
  cursor: "pointer",
  fontWeight: 900,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.28), 0 12px 28px rgba(15,23,42,0.08)",
};