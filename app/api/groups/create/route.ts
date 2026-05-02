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

    const body: { name?: unknown; memberIds?: unknown } = await req.json();
    const name = String(body.name || "").trim();

    const memberIdsRaw: unknown[] = Array.isArray(body.memberIds)
      ? body.memberIds
      : [];

    const memberIds: number[] = Array.from(
      new Set<number>(
        memberIdsRaw
          .map((v: unknown) => Number(v))
          .filter(
            (v: number) =>
              Number.isFinite(v) && v > 0 && v !== session.id
          )
      )
    );

    if (!name) {
      return NextResponse.json({ error: "群聊名称不能为空" }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json(
        { error: "群聊名称不能超过50个字符" },
        { status: 400 }
      );
    }

    if (memberIds.length === 0) {
      return NextResponse.json({ error: "至少选择一位好友" }, { status: 400 });
    }

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: session.id, user2Id: { in: memberIds } },
          { user2Id: session.id, user1Id: { in: memberIds } },
        ],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    const validFriendIds = new Set<number>();

    for (const item of friendships) {
      const friendId = item.user1Id === session.id ? item.user2Id : item.user1Id;
      validFriendIds.add(friendId);
    }

    const finalMemberIds: number[] = memberIds.filter((id: number) =>
      validFriendIds.has(id)
    );

    if (finalMemberIds.length === 0) {
      return NextResponse.json({ error: "所选成员不是你的好友" }, { status: 400 });
    }

    const group = await prisma.groupChat.create({
      data: {
        name,
        createdById: session.id,
        members: {
          create: [
            { userId: session.id },
            ...finalMemberIds.map((id: number) => ({ userId: id })),
          ],
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "群聊创建成功",
      groupId: group.id,
    });
  } catch (error) {
    console.error("group create error:", error);
    return NextResponse.json({ error: "创建群聊失败" }, { status: 500 });
  }
}