import WorkCardLite from "@/components/WorkCardLite";
import PaginationBar from "@/components/PaginationBar";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Show16PreferenceSelect from "@/components/Show16PreferenceSelect";

const PAGE_SIZE = 48;

export default async function WorksGridSection({
  title,
  type,
  basePath,
  currentPage,
  tag = "",
  show16 = true,
}: {
  title: string;
  type: "FOLDER" | "GIF" | "VIDEO";
  basePath: string;
  currentPage: number;
  tag?: string;
  show16?: boolean;
}) {
  const user = await getCurrentUser();

  const where = {
    type,
    ...(tag
      ? {
          tags: {
            contains: tag,
          },
        }
      : {}),
  };

  const totalWorks = await prisma.work.count({
    where,
  });

  const totalPages = Math.max(1, Math.ceil(totalWorks / PAGE_SIZE));

  const works = await prisma.work.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      author: true,
      files: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 36,
      },
      _count: {
        select: {
          files: true,
        },
      },
    },
  });

  function buildBasePath() {
    const usp = new URLSearchParams();
    if (tag) usp.set("tag", tag);
    if (show16) usp.set("show16", "true");
    return `${basePath}?${usp.toString()}`;
  }

  return (
    <div className="content-panel">
      <div
        className="content-panel-head"
        style={{
          marginBottom: 20,
          alignItems: "flex-end",
        }}
      >
        <div>
          <div className="content-panel-title">{title}</div>
          <div className="content-panel-subtitle">
            第 {currentPage} / {totalPages} 页　/　标签：{tag || "未筛选"}　/　16+：
            {show16 ? "显示" : "隐藏"}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            justifyContent: "flex-end",
          }}
        >
          <MiniBadge text={`总内容 ${totalWorks}`} />
          <MiniBadge text={type === "FOLDER" ? "图集流" : type === "GIF" ? "动图流" : "视频流"} />
        </div>
      </div>

      <form
        method="get"
        action={basePath}
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 180px 132px",
          gap: 12,
          marginBottom: 18,
          padding: 14,
          borderRadius: 24,
          background: "rgba(255,255,255,0.18)",
          border: "1px solid rgba(255,255,255,0.30)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        <input
          name="tag"
          defaultValue={tag}
          placeholder="按标签筛选，例如：制服 / 校园 / Cos"
          style={{
            width: "100%",
            borderRadius: 18,
            border: "1px solid var(--bf-input-border)",
            padding: "13px 16px",
            fontSize: 14,
            color: "var(--bf-panel-text)",
            background: "var(--bf-input-bg)",
            outline: "none",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        />

        <div
          style={{
            borderRadius: 18,
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.24)",
            background: "rgba(255,255,255,0.16)",
          }}
        >
          <Show16PreferenceSelect currentValue={show16} currentPath={basePath} tag={tag} />
        </div>

        <button
          type="submit"
          style={{
            border: "1px solid rgba(255,255,255,0.42)",
            borderRadius: 18,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.82), rgba(255,255,255,0.38)), rgba(255,255,255,0.36)",
            color: "#0f172a",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.34), 0 12px 28px rgba(15,23,42,0.08)",
          }}
        >
          筛选
        </button>
      </form>

      <div style={{ marginBottom: 20 }}>
        <PaginationBar
          basePath={buildBasePath()}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>

      {works.length === 0 ? (
        <div
          style={{
            color: "var(--bf-panel-text-soft)",
            padding: "26px 0",
            fontSize: 14,
          }}
        >
          还没有内容
        </div>
      ) : (
        <div className="works-grid">
          {works.map((work) => {
            const cover = work.coverUrl || work.files[0]?.fileUrl || "";

            let accessMode:
              | "allow"
              | "login_required"
              | "hot_locked"
              | "age_locked" = "allow";

            if (!user) {
              accessMode = "login_required";
            } else if (work.ageRating === "AGE_16_PLUS" && !show16) {
              accessMode = "age_locked";
            } else if (work.viewCount >= 99 && user.role === "BASIC") {
              accessMode = "hot_locked";
            }

            return (
              <WorkCardLite
                key={work.id}
                href={`/works/${work.id}${show16 ? "?show16=true" : ""}`}
                title={work.title}
                type={work.type}
                authorId={work.author.id}
                authorName={work.author.nickname}
                authorRole={work.author.role}
                authorXp={work.author.xp}
                pageCount={work._count.files}
                timeLabel="发布时间"
                timeValue={new Date(work.createdAt).toLocaleString("zh-CN")}
                cover={cover}
                viewCount={work.viewCount}
                tags={work.tags || ""}
                ageRating={work.ageRating}
                blurCover={work.ageRating === "AGE_16_PLUS" && !show16}
                accessMode={accessMode}
                previewFrames={work.type === "GIF" ? work.files.map((file) => file.fileUrl) : []}
              />
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <PaginationBar
          basePath={buildBasePath()}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </div>
    </div>
  );
}

function MiniBadge({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: "9px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 800,
        color: "var(--bf-panel-text)",
        background: "rgba(255,255,255,0.20)",
        border: "1px solid rgba(255,255,255,0.32)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16)",
      }}
    >
      {text}
    </div>
  );
}