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

    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        isBanned: true,
        isMuted: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (currentUser.isBanned) {
      return NextResponse.json({ error: "你的账号已被封禁" }, { status: 403 });
    }

    if (currentUser.isMuted) {
      return NextResponse.json({ error: "你已被禁言，暂时无法发表评论" }, { status: 403 });
    }

    const body = await req.json();
    const workId = Number(body.workId);
    const content = String(body.content || "").trim();
    const emoticonIdRaw = body.emoticonId;
    const emoticonId =
      emoticonIdRaw === undefined || emoticonIdRaw === null || emoticonIdRaw === ""
        ? null
        : Number(emoticonIdRaw);

    if (!workId || Number.isNaN(workId)) {
      return NextResponse.json({ error: "作品无效" }, { status: 400 });
    }

    if (!content && emoticonId === null) {
      return NextResponse.json({ error: "评论内容和表情包不能同时为空" }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: "评论内容不能超过1000个字符" }, { status: 400 });
    }

    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { id: true },
    });

    if (!work) {
      return NextResponse.json({ error: "作品不存在" }, { status: 404 });
    }

    if (emoticonId !== null) {
      const emoticon = await prisma.emoticon.findFirst({
        where: {
          id: emoticonId,
          ownerId: session.id,
        },
        select: { id: true },
      });

      if (!emoticon) {
        return NextResponse.json({ error: "表情包不存在或不属于你" }, { status: 400 });
      }
    }

    await prisma.comment.create({
      data: {
        userId: session.id,
        workId,
        content,
        emoticonId,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "评论成功",
    });
  } catch (error) {
    console.error("comment create error:", error);
    return NextResponse.json({ error: "评论失败" }, { status: 500 });
  }
}