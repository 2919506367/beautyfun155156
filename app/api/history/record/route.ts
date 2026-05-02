import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

function getTodayStart() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

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
      select: { id: true, viewCount: true },
    });

    if (!work) {
      return NextResponse.json({ error: "作品不存在" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = getTodayStart();

    const existingHistory = await prisma.viewHistory.findUnique({
      where: {
        userId_workId: {
          userId: payload.id,
          workId,
        },
      },
      select: {
        userId: true,
        workId: true,
        viewedAt: true,
      },
    });

    let viewCountAdded = false;
    let xpAdded = 0;
    let action: "first_view" | "repeat_today" | "repeat_other_day" = "repeat_today";

    await prisma.$transaction(async (tx) => {
      if (!existingHistory) {
        await tx.viewHistory.create({
          data: {
            userId: payload.id,
            workId,
            viewedAt: now,
          },
        });

        await tx.work.update({
          where: { id: workId },
          data: {
            viewCount: {
              increment: 1,
            },
          },
        });

        await tx.user.update({
          where: { id: payload.id },
          data: {
            xp: {
              increment: 10,
            },
          },
        });

        viewCountAdded = true;
        xpAdded = 10;
        action = "first_view";
        return;
      }

      await tx.viewHistory.update({
        where: {
          userId_workId: {
            userId: payload.id,
            workId,
          },
        },
        data: {
          viewedAt: now,
        },
      });

      const lastViewedAt = new Date(existingHistory.viewedAt);
      const isViewedToday = lastViewedAt >= todayStart;

      if (isViewedToday) {
        action = "repeat_today";
        return;
      }

      await tx.work.update({
        where: { id: workId },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      });

      viewCountAdded = true;
      xpAdded = 0;
      action = "repeat_other_day";
    });

    const updatedWork = await prisma.work.findUnique({
      where: { id: workId },
      select: { id: true, viewCount: true },
    });

    const responseAction = action as "first_view" | "repeat_today" | "repeat_other_day";

    return NextResponse.json({
      ok: true,
      message:
        responseAction === "first_view"
          ? "首次浏览，已记录并增加经验"
          : responseAction === "repeat_other_day"
            ? "已记录浏览，增加了浏览量"
            : "今天已经看过，已更新时间",
      action: responseAction,
      viewCount: updatedWork?.viewCount ?? null,
      viewCountAdded,
      xpAdded,
    });
  } catch (error) {
    console.error("history record error:", error);
    return NextResponse.json({ error: "记录失败" }, { status: 500 });
  }
}