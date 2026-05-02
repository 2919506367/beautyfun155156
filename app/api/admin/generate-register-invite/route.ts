import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { randomCdk } from "@/lib/membership";

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

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "只有管理员可以生成注册邀请码" }, { status: 403 });
    }

    let code = "";
    let exists = true;

    while (exists) {
      code = randomCdk(10);
      const found = await prisma.registerInviteCode.findUnique({
        where: { code },
        select: { id: true },
      });
      exists = !!found;
    }

    const invite = await prisma.registerInviteCode.create({
      data: {
        code,
        createdById: user.id,
      },
    });

    return NextResponse.json({
      ok: true,
      code: invite.code,
    });
  } catch (error) {
    console.error("generate register invite error:", error);
    return NextResponse.json({ error: "生成失败" }, { status: 500 });
  }
}