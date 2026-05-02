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
      return NextResponse.json({ error: "只有管理员可以编辑帖子" }, { status: 403 });
    }

    const body = await req.json();

    const postId = Number(body.postId);
    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const category = String(body.category || "综合").trim() || "综合";
    const ageRating =
      body.ageRating === "AGE_16_PLUS" ? "AGE_16_PLUS" : "ALL_AGES";
    const isPinned = Boolean(body.isPinned);

    const mediaItems = Array.isArray(body.mediaItems)
      ? body.mediaItems
          .filter((item: any) => item?.url && item?.type)
          .map((item: any, index: number) => ({
            type:
              item.type === "VIDEO"
                ? "VIDEO"
                : item.type === "JPEG_SEQUENCE"
                ? "JPEG_SEQUENCE"
                : "IMAGE",
            url: String(item.url),
            sortOrder: index,
          }))
      : [];

    if (!postId || Number.isNaN(postId)) {
      return NextResponse.json({ error: "帖子无效" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }

    await prisma.forumPost.update({
      where: { id: postId },
      data: {
        title,
        content,
        category,
        ageRating,
        isPinned,
        coverUrl: mediaItems[0]?.url || null,
        mediaCount: mediaItems.length,
        mediaItems: {
          deleteMany: {},
          create: mediaItems,
        },
      },
    });

    return NextResponse.json({ ok: true, postId });
  } catch (error) {
    console.error("forum update post error:", error);
    return NextResponse.json({ error: "编辑论坛帖子失败" }, { status: 500 });
  }
}