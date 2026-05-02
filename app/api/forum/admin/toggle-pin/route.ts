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
      return NextResponse.json({ error: "只有管理员可以操作置顶" }, { status: 403 });
    }

    const body = await req.json();
    const postId = Number(body.postId);

    if (!postId || Number.isNaN(postId)) {
      return NextResponse.json({ error: "帖子无效" }, { status: 400 });
    }

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        isPinned: true,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "帖子不存在" }, { status: 404 });
    }

    await prisma.forumPost.update({
      where: { id: postId },
      data: {
        isPinned: !post.isPinned,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("forum toggle pin error:", error);
    return NextResponse.json({ error: "切换置顶失败" }, { status: 500 });
  }
}