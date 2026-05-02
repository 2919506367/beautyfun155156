import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const account = String(body.account || "").trim();
    const password = String(body.password || "").trim();
    const nickname = String(body.nickname || "").trim();
    const inviteCode = String(body.inviteCode || "").trim().toUpperCase();

    if (!account || !password || !nickname || !inviteCode) {
      return NextResponse.json(
        { error: "账号、密码、昵称、邀请码都不能为空" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "密码至少 6 位" },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({
      where: { account },
    });

    if (exists) {
      return NextResponse.json(
        { error: "这个账号已经被注册了" },
        { status: 400 }
      );
    }

    const invite = await prisma.registerInviteCode.findUnique({
      where: { code: inviteCode },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "邀请码不存在" },
        { status: 400 }
      );
    }

    if (invite.isUsed) {
      return NextResponse.json(
        { error: "邀请码已被使用" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        account,
        passwordHash,
        nickname,
        role: "BASIC",
      },
      select: {
        id: true,
        account: true,
        nickname: true,
        role: true,
      },
    });

    await prisma.registerInviteCode.update({
      where: { id: invite.id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedById: user.id,
      },
    });

    const token = signAuthToken(user);

    const res = NextResponse.json({
      ok: true,
      message: "注册成功",
      token,
      user,
    });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (error) {
    console.error("register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后再试" },
      { status: 500 }
    );
  }
}