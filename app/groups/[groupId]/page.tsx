import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteLayout from "@/components/SiteLayout";
import UserIdentity from "@/components/UserIdentity";
import GroupChatRealtime from "@/components/GroupChatRealtime";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function GroupChatPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const { groupId } = await params;
  const numericGroupId = Number(groupId);

  if (!numericGroupId || Number.isNaN(numericGroupId)) {
    notFound();
  }

  const membership = await prisma.groupChatMember.findFirst({
    where: {
      groupId: numericGroupId,
      userId: currentUser.id,
    },
    select: { id: true },
  });

  if (!membership) {
    return (
      <SiteLayout title="群聊" active="profile">
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0, color: "#111827" }}>无法打开群聊</h2>
          <div style={{ color: "#6b7280", marginBottom: 16 }}>
            你不在这个群聊中。
          </div>
          <Link
            href="/profile"
            style={{
              padding: "10px 16px",
              borderRadius: 12,
              background: "#111827",
              color: "#fff",
              textDecoration: "none",
              display: "inline-block",
              fontWeight: 700,
            }}
          >
            返回个人资料页
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const group = await prisma.groupChat.findUnique({
    where: { id: numericGroupId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      members: {
        select: {
          id: true,
          user: {
            select: {
              id: true,
              nickname: true,
              account: true,
              role: true,
              xp: true,
            },
          },
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          senderId: true,
          sender: {
            select: {
              id: true,
              nickname: true,
              role: true,
              xp: true,
            },
          },
        },
      },
    },
  });

  if (!group) {
    notFound();
  }

  return (
    <SiteLayout title={group.name} active="profile">
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
            href="/profile"
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
            ← 返回个人资料页
          </Link>
        </div>

        <div
          style={{
            marginBottom: 20,
            paddingBottom: 16,
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>
            当前群聊
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", marginBottom: 10 }}>
            {group.name}
          </div>
          <div style={{ fontSize: 14, color: "#6b7280", marginBottom: 12 }}>
            群成员：{group.members.length} 人　/　创建时间：{new Date(group.createdAt).toLocaleString()}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {group.members.map((item) => (
              <UserIdentity
                key={item.id}
                userId={item.user.id}
                nickname={item.user.nickname}
                role={item.user.role}
                xp={item.user.xp}
                size="sm"
              />
            ))}
          </div>
        </div>

        <GroupChatRealtime
          groupId={group.id}
          currentUserId={currentUser.id}
          initialMessages={group.messages.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </div>
    </SiteLayout>
  );
}