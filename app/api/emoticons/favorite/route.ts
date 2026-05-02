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
    const emoticonId = Number(body.emoticonId);

    if (!emoticonId || Number.isNaN(emoticonId)) {
      return NextResponse.json({ error: "表情包无效" }, { status: 400 });
    }

    const source = await prisma.emoticon.findUnique({
      where: { id: emoticonId },
      select: {
        id: true,
        ownerId: true,
        label: true,
        imageUrl: true,
      },
    });

    if (!source) {
      return NextResponse.json({ error: "表情包不存在" }, { status: 404 });
    }

    if (source.ownerId === session.id) {
      return NextResponse.json({ error: "这是你自己的表情包，不需要收藏" }, { status: 400 });
    }

    const exists = await prisma.emoticon.findFirst({
      where: {
        ownerId: session.id,
        copiedFromId: source.id,
      },
      select: { id: true },
    });

    if (exists) {
      return NextResponse.json({ error: "你已经收藏过这个表情包了" }, { status: 400 });
    }

    await prisma.emoticon.create({
      data: {
        ownerId: session.id,
        label: source.label,
        imageUrl: source.imageUrl,
        copiedFromId: source.id,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "表情包已收藏到你的账号",
    });
  } catch (error) {
    console.error("favorite emoticon error:", error);
    return NextResponse.json({ error: "收藏表情包失败" }, { status: 500 });
  }
}