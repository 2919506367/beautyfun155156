import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";
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
const title = String(formData.get("title") || "").trim();
const type = String(formData.get("type") || "").trim() as "FOLDER" | "GIF" | "VIDEO";
const tagsRaw = String(formData.get("tags") || "").trim();
const ageRating = String(formData.get("ageRating") || "ALL_AGES").trim() as "ALL_AGES" | "AGE_16_PLUS";
const files = formData.getAll("files") as File[];

    if (!title) {
      return NextResponse.json({ error: "标题不能为空" }, { status: 400 });
    }

    if (!["FOLDER", "GIF", "VIDEO"].includes(type)) {
      return NextResponse.json({ error: "作品类型不合法" }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "请上传文件" }, { status: 400 });
    }

    if (type === "VIDEO" && files.length !== 1) {
      return NextResponse.json({ error: "视频只能上传一个文件" }, { status: 400 });
    }

    if ((type === "FOLDER" || type === "GIF") && files.length < 1) {
      return NextResponse.json({ error: "请至少上传一张图片" }, { status: 400 });
    }
   if (!["ALL_AGES", "AGE_16_PLUS"].includes(ageRating)) {
     return NextResponse.json({ error: "年龄标签不合法" }, { status: 400 });
   }

    const baseDir = path.join(process.cwd(), "public", "uploads", "works");

    let targetDir = "";
    if (type === "FOLDER") targetDir = path.join(baseDir, "folders");
    if (type === "GIF") targetDir = path.join(baseDir, "gifs");
    if (type === "VIDEO") targetDir = path.join(baseDir, "videos");

    await mkdir(targetDir, { recursive: true });

const work = await prisma.work.create({
  data: {
    title,
    type,
    tags: tagsRaw,
    ageRating,
    authorId: payload.id,
  },
});

    const sortedFiles =
      type === "VIDEO"
        ? files
        : [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }));

    const savedFiles: { fileUrl: string; sortOrder: number }[] = [];

    for (let i = 0; i < sortedFiles.length; i++) {
      const file = sortedFiles[i];
      if (!file || file.size === 0) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = file.name.split(".").pop()?.toLowerCase() || "dat";
      const fileName = `work_${work.id}_${Date.now()}_${i}.${ext}`;
      const filePath = path.join(targetDir, fileName);

      await writeFile(filePath, buffer);

      let fileUrl = "";
      if (type === "FOLDER") fileUrl = `/uploads/works/folders/${fileName}`;
      if (type === "GIF") fileUrl = `/uploads/works/gifs/${fileName}`;
      if (type === "VIDEO") fileUrl = `/uploads/works/videos/${fileName}`;

      savedFiles.push({
        fileUrl,
        sortOrder: i,
      });
    }

    if (savedFiles.length === 0) {
      await prisma.work.delete({ where: { id: work.id } });
      return NextResponse.json({ error: "没有成功保存任何文件" }, { status: 400 });
    }

    await prisma.workFile.createMany({
      data: savedFiles.map((item) => ({
        workId: work.id,
        fileUrl: item.fileUrl,
        sortOrder: item.sortOrder,
      })),
    });

    await prisma.work.update({
      where: { id: work.id },
      data: {
        coverUrl: savedFiles[0].fileUrl,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "上传成功",
      workId: work.id,
    });
  } catch (error) {
    console.error("work create error:", error);
    return NextResponse.json({ error: "上传失败" }, { status: 500 });
  }
}