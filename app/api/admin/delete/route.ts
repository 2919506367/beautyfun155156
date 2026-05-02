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
      return NextResponse.json({ error: "只有管理员可以删除论坛帖子" }, { status: 403 });
    }

    const body = await req.json();
    const postId = Number(body.postId);

    if (!postId || Number.isNaN(postId)) {
      return NextResponse.json({ error: "帖子无效" }, { status: 400 });
    }

    await prisma.forumPost.delete({
      where: {
        id: postId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("forum admin delete post error:", error);
    return NextResponse.json({ error: "删除论坛帖子失败" }, { status: 500 });
  }
}