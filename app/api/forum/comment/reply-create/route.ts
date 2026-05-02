import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const body = await req.json();
    const postId = Number(body.postId);
    const parentId = Number(body.parentId);
    const content = String(body.content || "").trim();
    const emoticonIdRaw = body.emoticonId;
    const emoticonId = emoticonIdRaw === null || emoticonIdRaw === undefined ? null : Number(emoticonIdRaw);

    if (!postId || Number.isNaN(postId)) {
      return NextResponse.json({ error: "帖子无效" }, { status: 400 });
    }

    if (!parentId || Number.isNaN(parentId)) {
      return NextResponse.json({ error: "父评论无效" }, { status: 400 });
    }

    if (!content && emoticonId === null) {
      return NextResponse.json({ error: "回复内容和表情包不能同时为空" }, { status: 400 });
    }

    const parent = await prisma.forumComment.findUnique({
      where: { id: parentId },
      select: { id: true, postId: true },
    });

    if (!parent || parent.postId !== postId) {
      return NextResponse.json({ error: "父评论不存在" }, { status: 404 });
    }

    let validEmoticonId: number | null = null;

    if (emoticonId !== null) {
      if (!Number.isInteger(emoticonId) || emoticonId <= 0) {
        return NextResponse.json({ error: "表情包无效" }, { status: 400 });
      }

      const emoticon = await prisma.emoticon.findUnique({
        where: { id: emoticonId },
        select: { id: true },
      });

      if (!emoticon) {
        return NextResponse.json({ error: "表情包不存在" }, { status: 404 });
      }

      validEmoticonId = emoticon.id;
    }

    await prisma.forumComment.create({
      data: {
        postId,
        userId: user.id,
        parentId,
        content,
        emoticonId: validEmoticonId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("forum comment reply create error:", error);
    return NextResponse.json({ error: "回复评论失败" }, { status: 500 });
  }
}
