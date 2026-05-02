import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const COOKIE_NAME = "bf_show16";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const value = body?.value === true;

    if (value) {
      const user = await getCurrentUser();

      if (!user || (user.role !== "GOLD" && user.role !== "ADMIN")) {
        const res = NextResponse.json(
          {
            error: "普通用户无法开启16+模式，只有黄金会员和管理员可以开启。",
          },
          { status: 403 }
        );

        res.cookies.set(COOKIE_NAME, "false", {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365,
        });

        return res;
      }
    }

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
