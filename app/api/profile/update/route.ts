import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
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

    const formData = await req.formData();
    const nickname = String(formData.get("nickname") || "").trim();
    const avatar = formData.get("avatar") as File | null;

    if (!nickname) {
      return NextResponse.json({ error: "昵称不能为空" }, { status: 400 });
    }

    let avatarUrl: string | undefined = undefined;

    if (avatar && avatar.size > 0) {
      const bytes = await avatar.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext =
        avatar.name.split(".").pop()?.toLowerCase() || "png";

      const fileName = `user_${payload.id}_${Date.now()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");

      await mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);

      avatarUrl = `/uploads/avatars/${fileName}`;
    }

    const updated = await prisma.user.update({
      where: { id: payload.id },
      data: {
        nickname,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
      select: {
        id: true,
        account: true,
        nickname: true,
        avatarUrl: true,
        role: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "资料已更新",
      user: updated,
    });
  } catch (error) {
    console.error("profile update error:", error);
    return NextResponse.json(
      { error: "资料更新失败" },
      { status: 500 }
    );
  }
}