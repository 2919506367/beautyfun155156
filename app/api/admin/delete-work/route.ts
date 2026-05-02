import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";

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

    const currentUser = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "用户不存在" }, { status: 401 });
    }

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json({ error: "只有管理员可以删除作品" }, { status: 403 });
    }

    const body = await req.json();
    const workId = Number(body.workId);

    if (!workId || Number.isNaN(workId)) {
      return NextResponse.json({ error: "作品ID无效" }, { status: 400 });
    }

    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: {
        files: true,
      },
    });

    if (!work) {
      return NextResponse.json({ error: "作品不存在" }, { status: 404 });
    }

    const filePaths = Array.from(
      new Set(
        work.files
          .map((f) => f.fileUrl)
          .filter(Boolean)
          .map((url) => path.join(process.cwd(), "public", url.replace(/^\//, "")))
      )
    );

    await prisma.comment.deleteMany({ where: { workId } });
    await prisma.favorite.deleteMany({ where: { workId } });
    await prisma.viewHistory.deleteMany({ where: { workId } });
    await prisma.workFile.deleteMany({ where: { workId } });
    await prisma.work.delete({ where: { id: workId } });

    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch {
      }
    }

    return NextResponse.json({
      ok: true,
      message: "作品删除成功",
    });
  } catch (error) {
    console.error("delete work error:", error);
    return NextResponse.json({ error: "删除作品失败" }, { status: 500 });
  }
}