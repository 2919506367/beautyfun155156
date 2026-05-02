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
    const requestId = Number(body.requestId);
    const action = String(body.action || "").trim();

    if (!requestId || Number.isNaN(requestId)) {
      return NextResponse.json({ error: "申请记录无效" }, { status: 400 });
    }

    if (action !== "accept" && action !== "reject") {
      return NextResponse.json({ error: "处理动作无效" }, { status: 400 });
    }

    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      select: {
        id: true,
        fromUserId: true,
        toUserId: true,
        status: true,
      },
    });

    if (!request) {
      return NextResponse.json({ error: "好友申请不存在" }, { status: 404 });
    }

    if (request.toUserId !== session.id) {
      return NextResponse.json({ error: "你无权处理这条好友申请" }, { status: 403 });
    }

    if (request.status !== "PENDING") {
      return NextResponse.json({ error: "这条好友申请已经处理过了" }, { status: 400 });
    }

    if (action === "reject") {
      await prisma.friendRequest.update({
        where: { id: request.id },
        data: {
          status: "REJECTED",
        },
      });

      return NextResponse.json({
        ok: true,
        message: "已拒绝好友申请",
      });
    }

    const user1Id = Math.min(request.fromUserId, request.toUserId);
    const user2Id = Math.max(request.fromUserId, request.toUserId);

    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id,
          user2Id,
        },
      },
    });

    if (!existingFriendship) {
      await prisma.friendship.create({
        data: {
          user1Id,
          user2Id,
        },
      });
    }

    await prisma.friendRequest.update({
      where: { id: request.id },
      data: {
        status: "ACCEPTED",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "已同意好友申请",
    });
  } catch (error) {
    console.error("friend respond error:", error);
    return NextResponse.json({ error: "处理好友申请失败" }, { status: 500 });
  }
}