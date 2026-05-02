import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SiteLayout from "@/components/SiteLayout";
import UserIdentity from "@/components/UserIdentity";
import PrivateChatRealtime from "@/components/PrivateChatRealtime";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PrivateMessagePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const { userId } = await params;
  const targetUserId = Number(userId);

  if (!targetUserId || Number.isNaN(targetUserId)) {
    notFound();
  }

  if (targetUserId === currentUser.id) {
    notFound();
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      nickname: true,
      account: true,
      avatarUrl: true,
      role: true,
      xp: true,
    },
  });

  if (!targetUser) {
    notFound();
  }

  const user1Id = Math.min(currentUser.id, targetUserId);
  const user2Id = Math.max(currentUser.id, targetUserId);

  const friendship = await prisma.friendship.findUnique({
    where: {
      user1Id_user2Id: {
        user1Id,
        user2Id,
      },
    },
    select: { id: true },
  });

  if (!friendship) {
    return (
      <SiteLayout title="私聊" active="profile">
        <div
          style={{
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 22,
            padding: 24,
          }}
        >
          <h2 style={{ marginTop: 0, color: "#111827" }}>无法打开私聊</h2>
          <div style={{ color: "#6b7280", marginBottom: 16 }}>
            只有好友之间才能进行私聊。
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

  const messages = await prisma.privateMessage.findMany({
    where: {
      OR: [
        {
          fromUserId: currentUser.id,
          toUserId: targetUserId,
        },
        {
          fromUserId: targetUserId,
          toUserId: currentUser.id,
        },
      ],
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      fromUserId: true,
      toUserId: true,
      content: true,
      createdAt: true,
    },
  });

  return (
    <SiteLayout title={`与 ${targetUser.nickname} 的私聊`} active="profile">
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
            当前聊天对象
          </div>
          <UserIdentity
            userId={targetUser.id}
            nickname={targetUser.nickname}
            role={targetUser.role}
            xp={targetUser.xp}
          />
          <div style={{ marginTop: 8, color: "#6b7280", fontSize: 14 }}>
            账号：{targetUser.account}
          </div>
        </div>

        <PrivateChatRealtime
          targetUserId={targetUser.id}
          targetUserName={targetUser.nickname}
          currentUserId={currentUser.id}
          initialMessages={messages.map((item) => ({
            ...item,
            createdAt: item.createdAt.toISOString(),
          }))}
        />
      </div>
    </SiteLayout>
  );
}