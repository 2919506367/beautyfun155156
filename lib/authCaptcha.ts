import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const CAPTCHA_CODE_COOKIE = "beautyfun_captcha_code";
const CAPTCHA_TRUST_COOKIE = "beautyfun_captcha_trust";
const AUTH_ATTEMPT_COOKIE = "beautyfun_auth_attempts";

const CAPTCHA_MAX_AGE_SECONDS = 10 * 60;
const TRUST_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const ATTEMPT_WINDOW_SECONDS = 10 * 60;
const FREQUENT_ATTEMPT_LIMIT = 3;

type CaptchaPayload = {
  code: string;
  createdAt: number;
};

type TrustPayload = {
  trusted: true;
  createdAt: number;
};

type AttemptPayload = {
  count: number;
  startedAt: number;
};

function getJwtSecret() {
  return process.env.JWT_SECRET || "beautyfun-local-secret-123456";
}

function signPayload(payload: object, expiresIn: string | number) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
  });
}

function verifyPayload<T>(token: string | undefined | null): T | null {
  if (!token) return null;

  try {
    return jwt.verify(token, getJwtSecret()) as T;
  } catch {
    return null;
  }
}

export function generateFiveDigitCaptcha() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function readAttempts(req: NextRequest): AttemptPayload {
  const payload = verifyPayload<AttemptPayload>(
    req.cookies.get(AUTH_ATTEMPT_COOKIE)?.value
  );

  const now = Date.now();

  if (!payload || !payload.startedAt || now - payload.startedAt > ATTEMPT_WINDOW_SECONDS * 1000) {
    return {
      count: 0,
      startedAt: now,
    };
  }

  return payload;
}

export function shouldRequireCaptcha(req: NextRequest) {
  const trust = verifyPayload<TrustPayload>(
    req.cookies.get(CAPTCHA_TRUST_COOKIE)?.value
  );

  if (!trust?.trusted) return true;

  const attempts = readAttempts(req);
  return attempts.count >= FREQUENT_ATTEMPT_LIMIT;
}

export function setCaptchaChallengeCookie(res: NextResponse, code: string) {
  const token = signPayload(
    {
      code,
      createdAt: Date.now(),
    } satisfies CaptchaPayload,
    CAPTCHA_MAX_AGE_SECONDS
  );

  res.cookies.set(CAPTCHA_CODE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: CAPTCHA_MAX_AGE_SECONDS,
  });
}

export function validateCaptchaForRequest(req: NextRequest, input: string) {
  if (!shouldRequireCaptcha(req)) {
    return {
      ok: true,
      needCaptcha: false,
    };
  }

  const expected = verifyPayload<CaptchaPayload>(
    req.cookies.get(CAPTCHA_CODE_COOKIE)?.value
  );

  const normalizedInput = String(input || "").trim();

  if (!/^\d{5}$/.test(normalizedInput)) {
    return {
      ok: false,
      needCaptcha: true,
      error: "请输入 5 位数字验证码",
    };
  }

  if (!expected?.code) {
    return {
      ok: false,
      needCaptcha: true,
      error: "验证码已过期，请刷新验证码",
    };
  }

  if (expected.code !== normalizedInput) {
    return {
      ok: false,
      needCaptcha: true,
      error: "验证码错误，请重新输入",
    };
  }

  return {
    ok: true,
    needCaptcha: true,
  };
}

export function markAuthAttempt(req: NextRequest, res: NextResponse) {
  const attempts = readAttempts(req);
  const nextAttempts: AttemptPayload = {
    count: attempts.count + 1,
    startedAt: attempts.startedAt || Date.now(),
  };

  const token = signPayload(nextAttempts, ATTEMPT_WINDOW_SECONDS);

  res.cookies.set(AUTH_ATTEMPT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: ATTEMPT_WINDOW_SECONDS,
  });
}

export function markCaptchaTrusted(res: NextResponse) {
  const token = signPayload(
    {
      trusted: true,
      createdAt: Date.now(),
    } satisfies TrustPayload,
    TRUST_MAX_AGE_SECONDS
  );

  res.cookies.set(CAPTCHA_TRUST_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: TRUST_MAX_AGE_SECONDS,
  });

  res.cookies.set(AUTH_ATTEMPT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });

  res.cookies.set(CAPTCHA_CODE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 0,
  });
}

export function attachCaptchaState(req: NextRequest, res: NextResponse) {
  const needCaptcha = shouldRequireCaptcha(req);

  if (needCaptcha) {
    const code = generateFiveDigitCaptcha();
    setCaptchaChallengeCookie(res, code);
    return {
      needCaptcha,
      captchaCode: code,
    };
  }

  return {
    needCaptcha,
    captchaCode: "",
  };
}
