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

    if (!commentId || Number.isNaN(commentId)) {
      return NextResponse.json({ error: "评论无效" }, { status: 400 });
    }

    const existing = await prisma.forumCommentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      await prisma.forumCommentLike.delete({
        where: {
          commentId_userId: {
            commentId,
            userId: user.id,
          },
        },
      });

      return NextResponse.json({ ok: true, liked: false });
    }

    await prisma.forumCommentLike.create({
      data: {
        commentId,
        userId: user.id,
      },
    });

    return NextResponse.json({ ok: true, liked: true });
  } catch (error) {
    console.error("forum comment toggle like error:", error);
    return NextResponse.json({ error: "评论点赞失败" }, { status: 500 });
  }
}