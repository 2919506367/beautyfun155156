import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const session = verifyAuthToken(token);
    if (!session) {
      return NextResponse.json({ error: "登录状态已失效" }, { status: 401 });
    }

    const [friendships, groups] = await Promise.all([
      prisma.friendship.findMany({
        where: {
          OR: [{ user1Id: session.id }, { user2Id: session.id }],
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
            },
          },
          user2: {
            select: {
              id: true,
              nickname: true,
              account: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.groupChat.findMany({
        where: {
          members: {
            some: {
              userId: session.id,
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
      }),
    ]);

    const friends = friendships.map((item) =>
      item.user1.id === session.id ? item.user2 : item.user1
    );

    const privateConversations = await Promise.all(
      friends.map(async (friend) => {
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.privateMessage.findFirst({
            where: {
              OR: [
                {
                  fromUserId: session.id,
                  toUserId: friend.id,
                },
                {
                  fromUserId: friend.id,
                  toUserId: session.id,
                },
              ],
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              content: true,
              createdAt: true,
              isDeleted: true,
              emoticon: {
                select: {
                  imageUrl: true,
                  label: true,
                },
              },
            },
          }),
          prisma.privateMessage.count({
            where: {
              fromUserId: friend.id,
              toUserId: session.id,
              readAt: null,
            },
          }),
        ]);

        let preview = "还没有聊天记录";
        if (lastMessage) {
          if (lastMessage.isDeleted) {
            preview = "[消息已删除]";
          } else if (lastMessage.content?.trim()) {
            preview = lastMessage.content;
          } else if (lastMessage.emoticon) {
            preview = `[表情] ${lastMessage.emoticon.label || "表情包"}`;
          } else {
            preview = "还没有聊天记录";
          }
        }

        return {
          kind: "private" as const,
          id: friend.id,
          title: friend.nickname,
          subtitle: `账号：${friend.account}`,
          avatarUrl: friend.avatarUrl,
          preview,
          updatedAt: lastMessage?.createdAt
            ? lastMessage.createdAt.toISOString()
            : null,
          unreadCount,
        };
      })
    );

    const groupConversations = await Promise.all(
      groups.map(async (group) => {
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.groupMessage.findFirst({
            where: {
              groupId: group.id,
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              content: true,
              createdAt: true,
              isDeleted: true,
              emoticon: {
                select: {
                  imageUrl: true,
                  label: true,
                },
              },
              sender: {
                select: {
                  nickname: true,
                },
              },
            },
          }),
          prisma.groupMessage.count({
            where: {
              groupId: group.id,
              senderId: {
                not: session.id,
              },
              readAt: null,
            },
          }),
        ]);

        let preview = "还没有群消息";
        if (lastMessage) {
          const prefix = `${lastMessage.sender.nickname}：`;

          if (lastMessage.isDeleted) {
            preview = `${prefix}[消息已删除]`;
          } else if (lastMessage.content?.trim()) {
            preview = `${prefix}${lastMessage.content}`;
          } else if (lastMessage.emoticon) {
            preview = `${prefix}[表情] ${lastMessage.emoticon.label || "表情包"}`;
          } else {
            preview = "还没有群消息";
          }
        }

        return {
          kind: "group" as const,
          id: group.id,
          title: group.name,
          subtitle: `${group._count.members} 位成员`,
          avatarUrl: null as string | null,
          preview,
          updatedAt: lastMessage?.createdAt
            ? lastMessage.createdAt.toISOString()
            : group.createdAt.toISOString(),
          unreadCount,
        };
      })
    );

    return NextResponse.json({
      ok: true,
      conversations: [...privateConversations, ...groupConversations],
    });
  } catch (error) {
    console.error("chat summary error:", error);
    return NextResponse.json({ error: "获取会话列表失败" }, { status: 500 });
  }
}