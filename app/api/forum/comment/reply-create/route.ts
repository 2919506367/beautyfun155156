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

    if (!postId || Number.isNaN(postId)) {
      return NextResponse.json({ error: "帖子无效" }, { status: 400 });
    }

    if (!parentId || Number.isNaN(parentId)) {
      return NextResponse.json({ error: "父评论无效" }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: "回复不能为空" }, { status: 400 });
    }

    const parent = await prisma.forumComment.findUnique({
      where: { id: parentId },
      select: { id: true, postId: true },
    });

    if (!parent || parent.postId !== postId) {
      return NextResponse.json({ error: "父评论不存在" }, { status: 404 });
    }

    await prisma.forumComment.create({
      data: {
        postId,
        userId: user.id,
        parentId,
        content,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("forum comment reply create error:", error);
    return NextResponse.json({ error: "回复评论失败" }, { status: 500 });
  }
}