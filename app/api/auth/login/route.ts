import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, signAuthToken } from "@/lib/auth";
import {
  markAuthAttempt,
  markCaptchaTrusted,
  shouldRequireCaptcha,
  validateCaptchaForRequest,
} from "@/lib/authCaptcha";

function authError(req: NextRequest, message: string, status = 400) {
  const res = NextResponse.json(
    {
      error: message,
      needCaptcha: shouldRequireCaptcha(req),
    },
    { status }
  );

  markAuthAttempt(req, res);
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const account = String(body.account || "").trim();
    const password = String(body.password || "").trim();
    const captchaCode = String(body.captchaCode || "").trim();

    const captchaResult = validateCaptchaForRequest(req, captchaCode);

    if (!captchaResult.ok) {
      return authError(req, captchaResult.error || "验证码错误", 400);
    }

    if (!account || !password) {
      return authError(req, "账号和密码不能为空", 400);
    }

    const user = await prisma.user.findUnique({
      where: { account },
    });

    if (!user) {
      return authError(req, "账号或密码错误", 400);
    }

    if (user.isBanned) {
      return authError(req, "该账号已被封禁，无法登录", 403);
    }

    const matched = await bcrypt.compare(password, user.passwordHash);

    if (!matched) {
      return authError(req, "账号或密码错误", 400);
    }

    const token = signAuthToken({
      id: user.id,
      account: user.account,
      nickname: user.nickname,
      role: user.role,
    });

    const res = NextResponse.json({
      ok: true,
      message: "登录成功",
      token,
      user: {
        id: user.id,
        account: user.account,
        nickname: user.nickname,
        role: user.role,
        isBanned: user.isBanned,
        isMuted: user.isMuted,
      },
    });

    res.cookies.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    markCaptchaTrusted(res);

    return res;
  } catch (error) {
    console.error("login error:", error);
    return NextResponse.json(
      { error: "登录失败，请稍后再试" },
      { status: 500 }
    );
  }
}
