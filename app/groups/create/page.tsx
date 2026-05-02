import Link from "next/link";
import { redirect } from "next/navigation";
import SiteLayout from "@/components/SiteLayout";
import CreateGroupPanel from "@/components/CreateGroupPanel";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function CreateGroupPage() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ user1Id: currentUser.id }, { user2Id: currentUser.id }],
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      user1: {
        select: {
          id: true,
          nickname: true,
          account: true,
          avatarUrl: true,
          role: true,
          xp: true,
        },
      },
      user2: {
        select: {
          id: true,
          nickname: true,
          account: true,
          avatarUrl: true,
          role: true,
          xp: true,
        },
      },
    },
  });

  const friends = friendships.map((item) => {
    const friend = item.user1.id === currentUser.id ? item.user2 : item.user1;

    return {
      friendshipId: item.id,
      friend: {
        id: friend.id,
        nickname: friend.nickname,
        account: friend.account,
        avatarUrl: friend.avatarUrl,
        role: friend.role,
        xp: friend.xp,
      },
    };
  });

  return (
    <SiteLayout title="创建群聊" active="profile">
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

      <CreateGroupPanel friends={friends} />
    </SiteLayout>
  );
}