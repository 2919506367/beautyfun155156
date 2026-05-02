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
    const groupId = Number(body.groupId);

    if (!groupId || Number.isNaN(groupId)) {
      return NextResponse.json({ error: "群聊无效" }, { status: 400 });
    }

    const readAt = new Date();

    await prisma.groupMessage.updateMany({
      where: {
        groupId,
        senderId: {
          not: session.id,
        },
        readAt: null,
      },
      data: {
        readAt,
      },
    });

    const io = getSocketServer();
    if (io) {
      io.to(buildUserRoom(session.id)).emit("group:read", {
        groupId,
        readerUserId: session.id,
        readAt: readAt.toISOString(),
      });

      io.to(buildUserRoom(session.id)).emit("chat:summary-updated", {
        kind: "group",
        id: groupId,
        preview: "",
        updatedAt: readAt.toISOString(),
        unreadCount: 0,
      });
    }

    return NextResponse.json({ ok: true, readAt: readAt.toISOString() });
  } catch (error) {
    console.error("group mark read error:", error);
    return NextResponse.json({ error: "标记群消息已读失败" }, { status: 500 });
  }
}
