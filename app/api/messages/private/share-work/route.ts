import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { getSocketServer } from "@/lib/socket/server";
import { buildPrivateRoom, buildUserRoom } from "@/lib/socket/rooms";

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

function buildPreviewFromMessage(item: {
  content: string;
  sharedWork?: { id: number } | null;
}) {
  if (item.sharedWork) return item.content?.trim() || "分享了一个作品";
  if (item.content?.trim()) return item.content;
  return "新消息";
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const targetUserId = Number(body.targetUserId);
    const workId = Number(body.workId);
    const note = String(body.note || "").trim();

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: "聊天对象无效" }, { status: 400 });
    }

    if (!workId || Number.isNaN(workId)) {
      return NextResponse.json({ error: "作品ID无效" }, { status: 400 });
    }

    if (targetUserId === session.id) {
      return NextResponse.json({ error: "不能给自己分享作品" }, { status: 400 });
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
      return NextResponse.json({ error: "只有好友之间才能分享作品" }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "聊天对象不存在" }, { status: 404 });
    }

    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { id: true },
    });

    if (!work) {
      return NextResponse.json({ error: "作品不存在" }, { status: 404 });
    }

    const created = await prisma.privateMessage.create({
      data: {
        fromUserId: session.id,
        toUserId: targetUserId,
        content: note || "分享了一个作品",
        sharedWorkId: work.id,
      },
      select: privateMessageSelect,
    });

    const io = getSocketServer();
    if (io) {
      const payload = serializeMessage(created);

      io.to(buildPrivateRoom(session.id, targetUserId)).emit(
        "private:message-created",
        payload
      );

      const preview = buildPreviewFromMessage(created);

      io.to(buildUserRoom(session.id)).emit("chat:summary-updated", {
        kind: "private",
        id: targetUserId,
        preview,
        updatedAt: created.createdAt.toISOString(),
        unreadCount: 0,
      });

      const unreadCount = await prisma.privateMessage.count({
        where: {
          fromUserId: session.id,
          toUserId: targetUserId,
          readAt: null,
        },
      });

      io.to(buildUserRoom(targetUserId)).emit("chat:summary-updated", {
        kind: "private",
        id: session.id,
        preview,
        updatedAt: created.createdAt.toISOString(),
        unreadCount,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "作品分享成功",
    });
  } catch (error) {
    console.error("private message share work error:", error);
    return NextResponse.json({ error: "分享作品失败" }, { status: 500 });
  }
}
