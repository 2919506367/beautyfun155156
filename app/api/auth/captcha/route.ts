import { NextRequest, NextResponse } from "next/server";
import {
  generateFiveDigitCaptcha,
  setCaptchaChallengeCookie,
  shouldRequireCaptcha,
} from "@/lib/authCaptcha";

export async function GET(req: NextRequest) {
  const needCaptcha = shouldRequireCaptcha(req);
  const code = needCaptcha ? generateFiveDigitCaptcha() : "";

  const res = NextResponse.json({
    ok: true,
    needCaptcha,
    captchaCode: code,
    message: needCaptcha ? "需要验证码" : "当前不需要验证码",
  });

  if (needCaptcha) {
    setCaptchaChallengeCookie(res, code);
  }

  return res;
}
