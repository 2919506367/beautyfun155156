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

    const canDelete = user.role === "ADMIN" || comment.userId === user.id;

    if (!canDelete) {
      return NextResponse.json({ error: "无权删除该评论" }, { status: 403 });
    }

    await prisma.forumComment.delete({
      where: { id: commentId },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("forum comment delete error:", error);
    return NextResponse.json({ error: "删除评论失败" }, { status: 500 });
  }
}