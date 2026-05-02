import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const session = verifyAuthToken(token);
    if (!session) {
      return NextResponse.json({ error: "登录状态已失效" }, { status: 401 });
    }

    const body = await req.json();
    const label = String(body.label || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();

    if (!imageUrl) {
      return NextResponse.json({ error: "图片链接不能为空" }, { status: 400 });
    }

    await prisma.emoticon.create({
      data: {
        ownerId: session.id,
        label: label || null,
        imageUrl,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "表情包添加成功",
    });
  } catch (error) {
    console.error("create emoticon error:", error);
    return NextResponse.json({ error: "添加表情包失败" }, { status: 500 });
  }
}