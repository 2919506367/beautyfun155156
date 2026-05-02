import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { getSocketServer } from "@/lib/socket/server";
import { buildGroupRoom, buildUserRoom } from "@/lib/socket/rooms";

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

function buildPreviewFromMessage(item: {
  isDeleted?: boolean | null;
  content: string;
  emoticon?: { label: string | null } | null;
  sharedWork?: { id: number } | null;
  sender: { nickname: string };
}) {
  const prefix = `${item.sender.nickname}：`;
  if (item.isDeleted) return `${prefix}[消息已删除]`;
  if (item.sharedWork) return `${prefix}${item.content?.trim() || "分享了一个作品"}`;
  if (item.content?.trim()) return `${prefix}${item.content}`;
  if (item.emoticon) return `${prefix}[表情] ${item.emoticon.label || "表情包"}`;
  return `${prefix}新消息`;
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
      return NextResponse.json({ error: "你已被禁言，暂时无法发送群消息" }, { status: 403 });
    }

    const body = await req.json();
    const groupId = Number(body.groupId);
    const content = String(body.content || "").trim();
    const replyToIdRaw = body.replyToId;
    const replyToId =
      replyToIdRaw === undefined || replyToIdRaw === null || replyToIdRaw === ""
        ? null
        : Number(replyToIdRaw);
    const mentionText = body.mentionText || null;
    const emoticonIdRaw = body.emoticonId;
    const emoticonId =
      emoticonIdRaw === undefined || emoticonIdRaw === null || emoticonIdRaw === ""
        ? null
        : Number(emoticonIdRaw);
    const sharedWorkIdRaw = body.sharedWorkId;
    const sharedWorkId =
      sharedWorkIdRaw === undefined || sharedWorkIdRaw === null || sharedWorkIdRaw === ""
        ? null
        : Number(sharedWorkIdRaw);

    if (!groupId || Number.isNaN(groupId)) {
      return NextResponse.json({ error: "群聊无效" }, { status: 400 });
    }

    if (!content && emoticonId === null && sharedWorkId === null) {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "消息内容不能超过1000个字符" }, { status: 400 });
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

    if (replyToId !== null) {
      const replyTarget = await prisma.groupMessage.findFirst({
        where: {
          id: replyToId,
          groupId,
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

    if (sharedWorkId !== null) {
      const work = await prisma.work.findUnique({
        where: { id: sharedWorkId },
        select: { id: true },
      });

      if (!work) {
        return NextResponse.json({ error: "要分享的作品不存在" }, { status: 400 });
      }
    }

    const created = await prisma.groupMessage.create({
      data: {
        groupId,
        senderId: session.id,
        content,
        replyToId,
        mentionText,
        emoticonId,
        sharedWorkId,
      },
      select: groupMessageSelect,
    });

    const io = getSocketServer();
    if (io) {
      const payload = serializeMessage(created);

      io.to(buildGroupRoom(groupId)).emit("group:message-created", payload);

      const preview = buildPreviewFromMessage(created);
      const memberIds = await prisma.groupChatMember.findMany({
        where: { groupId },
        select: { userId: true },
      });

      await Promise.all(
        memberIds.map(async ({ userId }) => {
          const unreadCount =
            userId === session.id
              ? 0
              : await prisma.groupMessage.count({
                  where: {
                    groupId,
                    senderId: {
                      not: userId,
                    },
                    readAt: null,
                  },
                });

          io.to(buildUserRoom(userId)).emit("chat:summary-updated", {
            kind: "group",
            id: groupId,
            preview,
            updatedAt: created.createdAt.toISOString(),
            unreadCount,
          });
        })
      );
    }

    return NextResponse.json({
      ok: true,
      message: "发送成功",
      sentMessageId: created.id,
    });
  } catch (error) {
    console.error("group send message error:", error);
    return NextResponse.json({ error: "发送群消息失败" }, { status: 500 });
  }
}
