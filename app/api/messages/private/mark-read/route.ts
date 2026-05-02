import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { getSocketServer } from "@/lib/socket/server";
import { buildUserRoom } from "@/lib/socket/rooms";

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

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: "聊天对象无效" }, { status: 400 });
    }

    const readAt = new Date();

    await prisma.privateMessage.updateMany({
      where: {
        fromUserId: targetUserId,
        toUserId: session.id,
        readAt: null,
      },
      data: {
        readAt,
      },
    });

    const io = getSocketServer();
    if (io) {
      io.to(buildUserRoom(targetUserId)).emit("private:read", {
        readerUserId: session.id,
        partnerUserId: targetUserId,
        readAt: readAt.toISOString(),
      });

      io.to(buildUserRoom(session.id)).emit("chat:summary-updated", {
        kind: "private",
        id: targetUserId,
        preview: "",
        updatedAt: readAt.toISOString(),
        unreadCount: 0,
      });

      const unreadCountForSender = await prisma.privateMessage.count({
        where: {
          fromUserId: targetUserId,
          toUserId: session.id,
          readAt: null,
        },
      });

      io.to(buildUserRoom(session.id)).emit("chat:summary-updated", {
        kind: "private",
        id: targetUserId,
        preview: "",
        updatedAt: readAt.toISOString(),
        unreadCount: unreadCountForSender,
      });
    }

    return NextResponse.json({ ok: true, readAt: readAt.toISOString() });
  } catch (error) {
    console.error("private mark read error:", error);
    return NextResponse.json({ error: "标记已读失败" }, { status: 500 });
  }
}
