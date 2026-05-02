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
      return NextResponse.json({ error: "只有管理员可以发帖" }, { status: 403 });
    }

    const body = await req.json();

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
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

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }

    const coverUrl = mediaItems[0]?.url || null;

    const post = await prisma.forumPost.create({
      data: {
        title,
        content,
        ageRating,
        isPinned,
        coverUrl,
        mediaCount: mediaItems.length,
        authorId: user.id,
        mediaItems: {
          create: mediaItems,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      postId: post.id,
    });
  } catch (error) {
    console.error("forum create form error:", error);
    return NextResponse.json({ error: "发布论坛帖子失败" }, { status: 500 });
  }
}