import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "只有管理员可以审核评论" }, { status: 403 });
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
        isHidden: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: "评论不存在" }, { status: 404 });
    }

    await prisma.forumComment.update({
      where: { id: commentId },
      data: {
        isHidden: !comment.isHidden,
      },
    });

    return NextResponse.json({ ok: true, hidden: !comment.isHidden });
  } catch (error) {
    console.error("forum comment moderate error:", error);
    return NextResponse.json({ error: "审核评论失败" }, { status: 500 });
  }
}