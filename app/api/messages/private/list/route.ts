import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

const privateMessageSelect = {
  id: true,
  fromUserId: true,
  toUserId: true,
  content: true,
  createdAt: true,
  readAt: true,
  editedAt: true,
  isDeleted: true,
  mentionText: true,
  emoticon: {
    select: {
      id: true,
      label: true,
      imageUrl: true,
    },
  },
  sharedWork: {
    select: {
      id: true,
      title: true,
      type: true,
      coverUrl: true,
      ageRating: true,
      createdAt: true,
      author: {
        select: {
          id: true,
          nickname: true,
          role: true,
          xp: true,
        },
      },
      files: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { fileUrl: true },
      },
    },
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      fromUserId: true,
      emoticon: {
        select: {
          id: true,
          label: true,
          imageUrl: true,
        },
      },
    },
  },
} as const;
function serializeWork(work: any) {
  if (!work) return null;
  return {
    ...work,
    createdAt: work.createdAt ? work.createdAt.toISOString() : undefined,
  };
}

function serializeMessage(message: any) {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt ? message.readAt.toISOString() : null,
    editedAt: message.editedAt ? message.editedAt.toISOString() : null,
    sharedWork: serializeWork(message.sharedWork),
  };
}

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const targetUserId = Number(searchParams.get("targetUserId"));

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: "聊天对象无效" }, { status: 400 });
    }

    const user1Id = Math.min(session.id, targetUserId);
    const user2Id = Math.max(session.id, targetUserId);

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
      return NextResponse.json({ error: "只有好友之间才能私聊" }, { status: 403 });
    }

    const messages = await prisma.privateMessage.findMany({
      where: {
        OR: [
          {
            fromUserId: session.id,
            toUserId: targetUserId,
          },
          {
            fromUserId: targetUserId,
            toUserId: session.id,
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
      select: privateMessageSelect,
    });

    return NextResponse.json({
      ok: true,
      messages: messages.map(serializeMessage),
    });
  } catch (error) {
    console.error("private message list error:", error);
    return NextResponse.json({ error: "获取私聊消息失败" }, { status: 500 });
  }
}
