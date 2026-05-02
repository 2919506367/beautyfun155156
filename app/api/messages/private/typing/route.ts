import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

const privateTypingMap = globalThis as typeof globalThis & {
  __beautyfunPrivateTyping?: Map<string, number>;
};

function getStore() {
  if (!privateTypingMap.__beautyfunPrivateTyping) {
    privateTypingMap.__beautyfunPrivateTyping = new Map<string, number>();
  }
  return privateTypingMap.__beautyfunPrivateTyping;
}

function buildKey(userId: number, targetUserId: number) {
  return `${userId}:${targetUserId}`;
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
    const targetUserId = Number(body.targetUserId);
    const isTyping = Boolean(body.isTyping);

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: "聊天对象无效" }, { status: 400 });
    }

    const store = getStore();
    const key = buildKey(session.id, targetUserId);

    if (isTyping) {
      store.set(key, Date.now() + 5000);
    } else {
      store.delete(key);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("private typing update error:", error);
    return NextResponse.json({ error: "更新输入状态失败" }, { status: 500 });
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
    const targetUserId = Number(searchParams.get("targetUserId"));

    if (!targetUserId || Number.isNaN(targetUserId)) {
      return NextResponse.json({ error: "聊天对象无效" }, { status: 400 });
    }

    const store = getStore();
    const key = buildKey(targetUserId, session.id);
    const expireAt = store.get(key) || 0;

    if (expireAt && expireAt < Date.now()) {
      store.delete(key);
      return NextResponse.json({ ok: true, isTyping: false });
    }

    return NextResponse.json({
      ok: true,
      isTyping: expireAt > Date.now(),
    });
  } catch (error) {
    console.error("private typing fetch error:", error);
    return NextResponse.json({ error: "获取输入状态失败" }, { status: 500 });
  }
}