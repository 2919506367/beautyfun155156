import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const existing = await prisma.forumSafeMode.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (!existing) {
      const created = await prisma.forumSafeMode.create({
        data: {
          userId: user.id,
          enabled: false,
        },
      });

      return NextResponse.json({ ok: true, enabled: created.enabled });
    }

    const updated = await prisma.forumSafeMode.update({
      where: {
        userId: user.id,
      },
      data: {
        enabled: !existing.enabled,
      },
    });

    return NextResponse.json({ ok: true, enabled: updated.enabled });
  } catch (error) {
    console.error("toggle forum safe mode error:", error);
    return NextResponse.json({ error: "切换论坛安全模式失败" }, { status: 500 });
  }
}