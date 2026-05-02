import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

function getSafeExt(filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".png" || ext === ".jpg" || ext === ".jpeg" || ext === ".webp" || ext === ".gif") {
    return ext;
  }
  return ".png";
}

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

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "没有选择文件" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "只能上传图片文件" }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: "图片不能超过 5MB" }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "emoticons");
    await mkdir(uploadDir, { recursive: true });

    const ext = getSafeExt(file.name || "");
    const fileName = `emo_${session.id}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/emoticons/${fileName}`;

    return NextResponse.json({
      ok: true,
      imageUrl,
    });
  } catch (error) {
    console.error("upload emoticon file error:", error);
    return NextResponse.json({ error: "上传表情包失败" }, { status: 500 });
  }
}