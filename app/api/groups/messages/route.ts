import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

const groupMessageSelect = {
  id: true,
  groupId: true,
  content: true,
  createdAt: true,
  senderId: true,
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
  sender: {
    select: {
      id: true,
      nickname: true,
      role: true,
      xp: true,
    },
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      emoticon: {
        select: {
          id: true,
          label: true,
          imageUrl: true,
        },
      },
      sender: {
        select: {
          nickname: true,
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
    const groupId = Number(searchParams.get("groupId"));

    if (!groupId || Number.isNaN(groupId)) {
      return NextResponse.json({ error: "群聊无效" }, { status: 400 });
    }

    const membership = await prisma.groupChatMember.findFirst({
      where: {
        groupId,
        userId: session.id,
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "你不在这个群聊中" }, { status: 403 });
    }

    const messages = await prisma.groupMessage.findMany({
      where: {
        groupId,
      },
      orderBy: {
        createdAt: "asc",
      },
      select: groupMessageSelect,
    });

    return NextResponse.json({
      ok: true,
      messages: messages.map(serializeMessage),
    });
  } catch (error) {
    console.error("group message list error:", error);
    return NextResponse.json({ error: "获取群消息失败" }, { status: 500 });
  }
}
