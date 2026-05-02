import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteLayout from "@/components/SiteLayout";
import UserIdentity from "@/components/UserIdentity";
import ShareWorkToGroupPanel from "@/components/ShareWorkToGroupPanel";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getWorkTypeLabel(type: "FOLDER" | "GIF" | "VIDEO") {
  if (type === "FOLDER") return "图集";
  if (type === "GIF") return "动图";
  return "视频";
}

export default async function ShareWorkToGroupPage({
  params,
}: {
  params: Promise<{ workId: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const { workId } = await params;
  const numericWorkId = Number(workId);

  if (!numericWorkId || Number.isNaN(numericWorkId)) {
    notFound();
  }

  const work = await prisma.work.findUnique({
    where: { id: numericWorkId },
    include: {
      author: {
        select: {
          id: true,
          nickname: true,
          role: true,
          xp: true,
        },
      },
      files: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
    },
  });

  if (!work) {
    notFound();
  }

  const groups = await prisma.groupChat.findMany({
    where: {
      members: {
        some: {
          userId: currentUser.id,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  const groupItems = groups.map((item) => ({
    id: item.id,
    name: item.name,
    createdAt: item.createdAt.toISOString(),
    memberCount: item._count.members,
  }));

  const cover = work.coverUrl || work.files[0]?.fileUrl || "";

  return (
    <SiteLayout title="转发作品到群聊" active="profile">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 360px",
          gap: 24,
          alignItems: "start",
        }}
      >
        <div>
          <ShareWorkToGroupPanel workId={work.id} groups={groupItems} />
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            padding: 24,
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <Link
              href={`/works/${work.id}`}
              style={{
                display: "inline-block",
                padding: "8px 14px",
                borderRadius: 12,
                background: "#f3f4f6",
                color: "#111827",
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              ← 返回作品详情页
            </Link>
          </div>

          <div style={{ marginBottom: 12, fontSize: 14, color: "#6b7280" }}>
            正在转发的作品
          </div>

          <div
            style={{
              overflow: "hidden",
              borderRadius: 18,
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <div
              style={{
                width: "100%",
                aspectRatio: "1 / 1",
                background: "#eef2f7",
                overflow: "hidden",
              }}
            >
              {cover ? (
                <img
                  src={cover}
                  alt={work.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : null}
            </div>

            <div style={{ padding: 16 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.5,
                  marginBottom: 10,
                }}
              >
                {work.title}
              </div>

              <div style={{ marginBottom: 10, fontSize: 14, color: "#4b5563" }}>
                类型：{getWorkTypeLabel(work.type)}　/　浏览：{work.viewCount}
              </div>

              <div style={{ marginBottom: 10 }}>
                <UserIdentity
                  userId={work.author.id}
                  nickname={work.author.nickname}
                  role={work.author.role}
                  xp={work.author.xp}
                />
              </div>

              <Link
                href={`/works/${work.id}`}
                style={{
                  display: "inline-block",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "#111827",
                  color: "#fff",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                查看作品详情
              </Link>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}