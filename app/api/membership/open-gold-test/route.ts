import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
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

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (user.role === "GOLD" || user.role === "ADMIN") {
      return NextResponse.json({ error: "当前已是高权限账号，无需开通" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { role: "GOLD" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("open gold test error:", error);
    return NextResponse.json({ error: "开通失败" }, { status: 500 });
  }
}