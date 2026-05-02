import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "只有管理员可以修改作品开放状态" }, { status: 403 });
    }

    const body = await req.json();
    const workId = Number(body?.workId);
    const isPublic = body?.isPublic === true;

    if (!workId || Number.isNaN(workId)) {
      return NextResponse.json({ error: "作品ID无效" }, { status: 400 });
    }

    const updated = await prisma.work.update({
      where: { id: workId },
      data: { isPublic },
      select: {
        id: true,
        isPublic: true,
      },
    });

    return NextResponse.json({
      ok: true,
      work: updated,
    });
  } catch (error) {
    console.error("toggle work public error:", error);
    return NextResponse.json({ error: "修改作品开放状态失败" }, { status: 500 });
  }
}
