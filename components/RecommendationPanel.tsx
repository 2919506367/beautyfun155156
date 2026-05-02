"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import WorkCardLite from "@/components/WorkCardLite";

type WorkType = "FOLDER" | "GIF" | "VIDEO";
type AccessMode = "allow" | "login_required" | "hot_locked";
type UserRoleType = "BASIC" | "GOLD" | "ADMIN";

type RecommendationItem = {
  id: number;
  title: string;
  type: WorkType;
  coverUrl: string | null;
  authorId: number;
  authorName: string;
  authorRole: UserRoleType;
  authorXp: number;
  fileUrl: string | null;
  viewCount: number;
  accessMode: AccessMode;
};

const BATCH_SIZE = 3;

function getWorkTypeLabel(type: WorkType) {
  if (type === "FOLDER") return "图集";
  if (type === "GIF") return "动图（帧序列）";
  return "视频";
}

export default function RecommendationPanel({
  items,
}: {
  items: RecommendationItem[];
}) {
  const safeItems = useMemo(() => items ?? [], [items]);
  const totalBatches = Math.max(1, Math.ceil(safeItems.length / BATCH_SIZE));
  const [batchIndex, setBatchIndex] = useState(0);

  const displayItems = useMemo(() => {
    if (safeItems.length <= BATCH_SIZE) return safeItems;
    const start = batchIndex * BATCH_SIZE;
    const sliced = safeItems.slice(start, start + BATCH_SIZE);
    return sliced.length > 0 ? sliced : safeItems.slice(0, BATCH_SIZE);
  }, [safeItems, batchIndex]);

  function handleNextBatch() {
    if (totalBatches <= 1) return;
    setBatchIndex((prev) => (prev + 1) % totalBatches);
  }

  return (
    <motion.aside
      className="recommendation-panel"
      initial={{ opacity: 0, y: 16, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "var(--bf-panel-bg)",
        border: "1px solid var(--bf-panel-border)",
        borderRadius: 28,
        padding: 18,
        overflow: "hidden",
        position: "relative",
        boxShadow: "var(--bf-shadow-md)",
        backdropFilter: "blur(22px)",
        WebkitBackdropFilter: "blur(22px)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.04)), radial-gradient(circle at top left, rgba(255,255,255,0.24), transparent 34%)",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginBottom: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 900,
              color: "var(--bf-panel-text)",
              letterSpacing: "-0.04em",
            }}
          >
            猜你喜欢
          </h3>

          <div
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "var(--bf-panel-text-soft)",
              lineHeight: 1.65,
            }}
          >
            同类型内容优先，按热度和新鲜度推荐
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {safeItems.length > 0 && (
            <div
              style={{
                fontSize: 12,
                color: "var(--bf-panel-text-soft)",
                whiteSpace: "nowrap",
                fontWeight: 800,
              }}
            >
              第 {Math.min(batchIndex + 1, totalBatches)} / {totalBatches} 组
            </div>
          )}

          <motion.button
            type="button"
            onClick={handleNextBatch}
            disabled={totalBatches <= 1}
            whileHover={totalBatches > 1 ? { y: -1.5, scale: 1.02 } : undefined}
            whileTap={totalBatches > 1 ? { scale: 0.98 } : undefined}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.34)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(255,255,255,0.28)), rgba(255,255,255,0.22)",
              color:
                totalBatches <= 1
                  ? "var(--bf-panel-text-soft)"
                  : "var(--bf-panel-text)",
              fontWeight: 900,
              cursor: totalBatches <= 1 ? "not-allowed" : "pointer",
              whiteSpace: "nowrap",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.28), 0 10px 22px rgba(15,23,42,0.08)",
            }}
          >
            换一批
          </motion.button>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        <SmallPill text="Liquid Picks" />
        <SmallPill text="动态推荐" />
        <SmallPill text="轻量卡片" />
      </div>

      <div className="recommendation-panel-scroll">
        {displayItems.length === 0 ? (
          <div
            style={{
              color: "var(--bf-panel-text-soft)",
              fontSize: 14,
              lineHeight: 1.8,
              padding: "4px 2px",
            }}
          >
            暂时没有可推荐内容
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={batchIndex}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {displayItems.map((item, index) => {
                const cover = item.coverUrl || item.fileUrl || "";

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 12, scale: 0.992 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      duration: 0.26,
                      delay: index * 0.04,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="recommendation-panel-card"
                  >
                    <WorkCardLite
                      href={`/works/${item.id}`}
                      title={item.title}
                      type={item.type}
                      authorId={item.authorId}
                      authorName={item.authorName}
                      authorRole={item.authorRole}
                      authorXp={item.authorXp}
                      timeLabel="类型"
                      timeValue={getWorkTypeLabel(item.type)}
                      cover={cover}
                      viewCount={item.viewCount}
                      accessMode={item.accessMode}
                    />
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </motion.aside>
  );
}

function SmallPill({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "7px 10px",
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