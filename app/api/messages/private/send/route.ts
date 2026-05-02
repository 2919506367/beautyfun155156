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
  isDeleted?: boolean | null;
  content: string;
  emoticon?: { label: string | null } | null;
  sharedWork?: { id: number } | null;
}) {
  if (item.isDeleted) return "[消息已删除]";
  if (item.sharedWork) return item.content?.trim() || "分享了一个作品";
  if (item.content?.trim()) return item.content;
  if (item.emoticon) return `[表情] ${item.emoticon.label || "表情包"}`;
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

    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        isBanned: true,
        isMuted: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (currentUser.isBanned) {
      return NextResponse.json({ error: "你的账号已被封禁" }, { status: 403 });
    }

    if (currentUser.isMuted) {
      return NextResponse.json({ error: "你已被禁言，暂时无法发送私信" }, { status: 403 });
    }

    const body = await req.json();
    const targetUserId = Number(body.targetUserId);
    const content = String(body.content || "").trim();
    const replyToIdRaw = body.replyToId;
    const replyToId =
      replyToIdRaw === undefined || replyToIdRaw === null || replyToIdRaw === ""
        ? null
        : Number(replyToIdRaw);
    const emoticonIdRaw = body.emoticonId;
    const emoticonId =
      emoticonIdRaw === undefined || emoticonIdRaw === null || emoticonIdRaw === ""
        ? null
        : Number(emoticonIdRaw);

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: "聊天对象无效" }, { status: 400 });
    }

    if (targetUserId === session.id) {
      return NextResponse.json({ error: "不能给自己发私信" }, { status: 400 });
    }

    if (!content && emoticonId === null) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "消息内容不能超过1000个字符" }, { status: 400 });
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

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "聊天对象不存在" }, { status: 404 });
    }

    if (replyToId !== null) {
      const replyTarget = await prisma.privateMessage.findFirst({
        where: {
          id: replyToId,
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
        select: { id: true },
      });

      if (!replyTarget) {
        return NextResponse.json({ error: "回复目标消息不存在" }, { status: 400 });
      }
    }

    if (emoticonId !== null) {
      const emoticon = await prisma.emoticon.findFirst({
        where: {
          id: emoticonId,
          ownerId: session.id,
        },
        select: { id: true },
      });

      if (!emoticon) {
        return NextResponse.json({ error: "表情包不存在或不属于你" }, { status: 400 });
      }
    }

    const created = await prisma.privateMessage.create({
      data: {
        fromUserId: session.id,
        toUserId: targetUserId,
        content,
        replyToId,
        emoticonId,
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
      message: "发送成功",
      sentMessageId: created.id,
    });
  } catch (error) {
    console.error("private message send error:", error);
    return NextResponse.json({ error: "发送私信失败" }, { status: 500 });
  }
}
