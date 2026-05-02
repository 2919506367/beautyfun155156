import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

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
    const sourceKind = String(body.sourceKind || "").trim();
    const messageId = Number(body.messageId);
    const targetKind = String(body.targetKind || "").trim();
    const targetId = Number(body.targetId);

    if (!messageId || Number.isNaN(messageId)) {
      return NextResponse.json({ error: "原消息无效" }, { status: 400 });
    }

    if (!targetId || Number.isNaN(targetId)) {
      return NextResponse.json({ error: "转发目标无效" }, { status: 400 });
    }

    if (!["private", "group"].includes(sourceKind)) {
      return NextResponse.json({ error: "原消息类型无效" }, { status: 400 });
    }

    if (!["private", "group"].includes(targetKind)) {
      return NextResponse.json({ error: "目标类型无效" }, { status: 400 });
    }

    let content = "";

    if (sourceKind === "private") {
      const msg = await prisma.privateMessage.findFirst({
        where: {
          id: messageId,
          OR: [
            { fromUserId: session.id },
            { toUserId: session.id },
          ],
        },
        select: {
          id: true,
          content: true,
          isDeleted: true,
        },
      });

      if (!msg) {
        return NextResponse.json({ error: "原私聊消息不存在" }, { status: 404 });
      }

      if (msg.isDeleted) {
        return NextResponse.json({ error: "已删除消息不能转发" }, { status: 400 });
      }

      content = `转发消息：${msg.content}`;
    } else {
      const membership = await prisma.groupChatMember.findFirst({
        where: {
          userId: session.id,
        },
        select: { id: true },
      });

      if (!membership) {
        return NextResponse.json({ error: "你当前不在任何群聊中" }, { status: 403 });
      }

      const msg = await prisma.groupMessage.findFirst({
        where: {
          id: messageId,
          group: {
            members: {
              some: {
                userId: session.id,
              },
            },
          },
        },
        select: {
          id: true,
          content: true,
          isDeleted: true,
        },
      });

      if (!msg) {
        return NextResponse.json({ error: "原群消息不存在" }, { status: 404 });
      }

      if (msg.isDeleted) {
        return NextResponse.json({ error: "已删除消息不能转发" }, { status: 400 });
      }

      content = `转发消息：${msg.content}`;
    }

    if (targetKind === "private") {
      const targetUserId = targetId;

      if (targetUserId === session.id) {
        return NextResponse.json({ error: "不能转发给自己" }, { status: 400 });
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
        return NextResponse.json({ error: "只能转发给好友" }, { status: 403 });
      }

      await prisma.privateMessage.create({
        data: {
          fromUserId: session.id,
          toUserId: targetUserId,
          content,
        },
      });

      return NextResponse.json({ ok: true, message: "已转发到私聊" });
    }

    const membership = await prisma.groupChatMember.findFirst({
      where: {
        groupId: targetId,
        userId: session.id,
      },
      select: { id: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "你不在目标群聊中" }, { status: 403 });
    }

    await prisma.groupMessage.create({
      data: {
        groupId: targetId,
        senderId: session.id,
        content,
      },
    });

    return NextResponse.json({ ok: true, message: "已转发到群聊" });
  } catch (error) {
    console.error("forward message error:", error);
    return NextResponse.json({ error: "转发失败" }, { status: 500 });
  }
}