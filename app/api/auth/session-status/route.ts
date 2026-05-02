import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({
        loggedIn: false,
        banned: false,
        muted: false,
      });
    }

    const session = verifyAuthToken(token);
    if (!session) {
      return NextResponse.json({
        loggedIn: false,
        banned: false,
        muted: false,
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        isBanned: true,
        isMuted: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        loggedIn: false,
        banned: false,
        muted: false,
      });
    }

    return NextResponse.json({
      loggedIn: true,
      banned: user.isBanned,
      muted: user.isMuted,
    });
  } catch (error) {
    console.error("session status check error:", error);
    return NextResponse.json(
      { error: "检查登录状态失败" },
      { status: 500 }
    );
  }
}