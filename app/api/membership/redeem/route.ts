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

    const req = arguments[0] as Request;
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json({ error: "CDK不能为空" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (user.role === "GOLD" || user.role === "ADMIN") {
      return NextResponse.json({ error: "当前账号无需兑换" }, { status: 400 });
    }

    const cdk = await prisma.membershipCdk.findUnique({
      where: { code },
    });

    if (!cdk) {
      return NextResponse.json({ error: "CDK不存在" }, { status: 404 });
    }

    if (cdk.isUsed) {
      return NextResponse.json({ error: "CDK已被使用" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { role: "GOLD" },
      }),
      prisma.membershipCdk.update({
        where: { id: cdk.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
          usedById: user.id,
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("redeem cdk error:", error);
    return NextResponse.json({ error: "兑换失败" }, { status: 500 });
  }
}