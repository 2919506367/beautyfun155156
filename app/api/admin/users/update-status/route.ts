import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const admin = await getCurrentUser();

    if (!admin) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (admin.role !== "ADMIN") {
      return NextResponse.json({ error: "只有管理员可以执行此操作" }, { status: 403 });
    }

    const body = await req.json();
    const account = String(body.account || "").trim();
    const isBanned = Boolean(body.isBanned);
    const isMuted = Boolean(body.isMuted);

    if (!account) {
      return NextResponse.json({ error: "账号不能为空" }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { account },
      select: {
        id: true,
        account: true,
        role: true,
      },
    });

    if (!target) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (target.id === admin.id) {
      return NextResponse.json({ error: "不能修改你自己的封禁/禁言状态" }, { status: 400 });
    }

    await prisma.user.update({
      where: { account },
      data: {
        isBanned,
        isMuted,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "用户状态更新成功",
    });
  } catch (error) {
    console.error("admin update user status error:", error);
    return NextResponse.json({ error: "更新用户状态失败" }, { status: 500 });
  }
}