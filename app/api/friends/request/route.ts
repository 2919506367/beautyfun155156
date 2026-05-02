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
    const targetUserId = Number(body.targetUserId);

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: "目标用户无效" }, { status: 400 });
    }

    if (targetUserId === session.id) {
      return NextResponse.json({ error: "不能给自己发送好友申请" }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
    }

    const user1Id = Math.min(session.id, targetUserId);
    const user2Id = Math.max(session.id, targetUserId);

    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id,
          user2Id,
        },
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ error: "你们已经是好友了" }, { status: 400 });
    }

    const existingRequest = await prisma.friendRequest.findFirst({
      where: {
        OR: [
          {
            fromUserId: session.id,
            toUserId: targetUserId,
            status: "PENDING",
          },
          {
            fromUserId: targetUserId,
            toUserId: session.id,
            status: "PENDING",
          },
        ],
      },
    });

    if (existingRequest) {
      return NextResponse.json({ error: "当前已经存在待处理的好友申请" }, { status: 400 });
    }

    await prisma.friendRequest.create({
      data: {
        fromUserId: session.id,
        toUserId: targetUserId,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "好友申请已发送",
    });
  } catch (error) {
    console.error("friend request error:", error);
    return NextResponse.json({ error: "发送好友申请失败" }, { status: 500 });
  }
}