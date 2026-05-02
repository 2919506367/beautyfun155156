import { NextResponse } from "next/server";

const COOKIE_NAME = "bf_show16";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const value = body?.value === true;

    const res = NextResponse.json({
      ok: true,
      value,
    });

    res.cookies.set(COOKIE_NAME, value ? "true" : "false", {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });

    return res;
  } catch (error) {
    console.error("set show16 preference error:", error);
    return NextResponse.json({ error: "设置16+偏好失败" }, { status: 500 });
  }
}