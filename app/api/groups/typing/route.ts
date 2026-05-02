import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

const groupTypingMap = globalThis as typeof globalThis & {
  __beautyfunGroupTyping?: Map<string, number>;
};

function getStore() {
  if (!groupTypingMap.__beautyfunGroupTyping) {
    groupTypingMap.__beautyfunGroupTyping = new Map<string, number>();
  }
  return groupTypingMap.__beautyfunGroupTyping;
}

function buildKey(groupId: number, userId: number) {
  return `${groupId}:${userId}`;
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
    const groupId = Number(body.groupId);
    const isTyping = Boolean(body.isTyping);

    if (!groupId || Number.isNaN(groupId)) {
      return NextResponse.json({ error: "群聊无效" }, { status: 400 });
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

    const store = getStore();
    const key = buildKey(groupId, session.id);

    if (isTyping) {
      store.set(key, Date.now() + 5000);
    } else {
      store.delete(key);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("group typing update error:", error);
    return NextResponse.json({ error: "更新群输入状态失败" }, { status: 500 });
  }
}

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const groupId = Number(searchParams.get("groupId"));

    if (!groupId || Number.isNaN(groupId)) {
      return NextResponse.json({ error: "群聊无效" }, { status: 400 });
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

    const members = await prisma.groupChatMember.findMany({
      where: {
        groupId,
        userId: {
          not: session.id,
        },
      },
      select: {
        userId: true,
        user: {
          select: {
            nickname: true,
          },
        },
      },
    });

    const store = getStore();
    const now = Date.now();

    const typingUsers = members
      .filter((item) => {
        const key = buildKey(groupId, item.userId);
        const expireAt = store.get(key) || 0;

        if (expireAt && expireAt < now) {
          store.delete(key);
          return false;
        }

        return expireAt > now;
      })
      .map((item) => ({
        userId: item.userId,
        nickname: item.user.nickname,
      }));

    return NextResponse.json({
      ok: true,
      typingUsers,
    });
  } catch (error) {
    console.error("group typing fetch error:", error);
    return NextResponse.json({ error: "获取群输入状态失败" }, { status: 500 });
  }
}