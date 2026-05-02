import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const payload = verifyAuthToken(token);
    if (!payload) {
      return NextResponse.json({ error: "登录已失效" }, { status: 401 });
    }

    const body = await req.json();
    const commentId = Number(body.commentId);

    if (!commentId || Number.isNaN(commentId)) {
      return NextResponse.json({ error: "评论ID无效" }, { status: 400 });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true },
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: payload.id,
          commentId,
        },
      },
    });

    if (existingLike) {
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId: payload.id,
            commentId,
          },
        },
      });
    } else {
      await prisma.commentLike.create({
        data: {
          userId: payload.id,
          commentId,
        },
      });
    }

    const likeCount = await prisma.commentLike.count({
      where: { commentId },
    });

    return NextResponse.json({
      ok: true,
      liked: !existingLike,
      likeCount,
    });
  } catch (error) {
    console.error("comment like error:", error);
    return NextResponse.json({ error: "点赞失败" }, { status: 500 });
  }
}