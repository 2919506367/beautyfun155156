import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { saveForumUpload } from "@/lib/forum-upload";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "只有管理员可以上传论坛媒体" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "文件无效" }, { status: 400 });
    }

    const url = await saveForumUpload(file, "forum");

    return NextResponse.json({
      ok: true,
      url,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("forum media upload error:", error);
    return NextResponse.json({ error: "论坛媒体上传失败" }, { status: 500 });
  }
}