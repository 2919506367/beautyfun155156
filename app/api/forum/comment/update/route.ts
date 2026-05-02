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
    const commentId = Number(body.commentId);
    const content = String(body.content || "").trim();
    const emoticonIdRaw = body.emoticonId;
    const emoticonId = emoticonIdRaw === null || emoticonIdRaw === undefined ? null : Number(emoticonIdRaw);

    if (!commentId || Number.isNaN(commentId)) {
      return NextResponse.json({ error: "评论无效" }, { status: 400 });
    }

    if (!content && emoticonId === null) {
      return NextResponse.json({ error: "评论内容和表情包不能同时为空" }, { status: 400 });
    }

    const comment = await prisma.forumComment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    const canEdit = user.role === "ADMIN" || comment.userId === user.id;

    if (!canEdit) {
      return NextResponse.json({ error: "无权编辑该评论" }, { status: 403 });
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

    await prisma.forumComment.update({
      where: { id: commentId },
      data: {
        content,
        emoticonId: validEmoticonId,
        editedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("forum comment update error:", error);
    return NextResponse.json({ error: "编辑评论失败" }, { status: 500 });
  }
}
