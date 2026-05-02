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
    const friendshipId = Number(body.friendshipId);

    if (!friendshipId || Number.isNaN(friendshipId)) {
      return NextResponse.json({ error: "好友关系无效" }, { status: 400 });
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
      select: {
        id: true,
        user1Id: true,
        user2Id: true,
      },
    });

    if (!friendship) {
      return NextResponse.json({ error: "好友关系不存在" }, { status: 404 });
    }

    if (friendship.user1Id !== session.id && friendship.user2Id !== session.id) {
      return NextResponse.json({ error: "你无权删除这条好友关系" }, { status: 403 });
    }

    await prisma.friendship.delete({
      where: { id: friendship.id },
    });

    return NextResponse.json({
      ok: true,
      message: "已删除好友",
    });
  } catch (error) {
    console.error("delete friend error:", error);
    return NextResponse.json({ error: "删除好友失败" }, { status: 500 });
  }
}