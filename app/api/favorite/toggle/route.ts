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
    const workId = Number(body.workId);

    if (!workId || Number.isNaN(workId)) {
      return NextResponse.json({ error: "作品ID无效" }, { status: 400 });
    }

    const work = await prisma.work.findUnique({
      where: { id: workId },
      select: { id: true },
    });

    if (!work) {
      return NextResponse.json({ error: "作品不存在" }, { status: 404 });
    }

    const existing = await prisma.favorite.findFirst({
      where: {
        userId: payload.id,
        workId,
      },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { id: existing.id },
      });

      return NextResponse.json({
        ok: true,
        action: "removed",
        message: "已取消收藏",
      });
    }

    await prisma.favorite.create({
      data: {
        userId: payload.id,
        workId,
      },
    });

    return NextResponse.json({
      ok: true,
      action: "added",
      message: "收藏成功",
    });
  } catch (error) {
    console.error("favorite toggle error:", error);
    return NextResponse.json({ error: "收藏操作失败" }, { status: 500 });
  }
}