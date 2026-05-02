import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const LEGACY_IMAGES_ROOT = String.raw`D:\HtmlServer\SerHtml\content\Images`;
const LEGACY_GIFS_ROOT = String.raw`D:\HtmlServer\SerHtml\content\Gifs`;
const LEGACY_VIDEOS_ROOT = String.raw`D:\HtmlServer\SerHtml\content\Videos`;

const NEW_WORKS_ROOT = path.join(process.cwd(), "public", "uploads", "works");
const NEW_FOLDER_ROOT = path.join(NEW_WORKS_ROOT, "folders");
const NEW_GIF_ROOT = path.join(NEW_WORKS_ROOT, "gifs");
const NEW_VIDEO_ROOT = path.join(NEW_WORKS_ROOT, "videos");

const IMPORT_OWNER_EMAIL = "123";

async function ensureDirs() {
  await fsp.mkdir(NEW_FOLDER_ROOT, { recursive: true });
  await fsp.mkdir(NEW_GIF_ROOT, { recursive: true });
  await fsp.mkdir(NEW_VIDEO_ROOT, { recursive: true });
}

function fileExists(p: string) {
  return fs.existsSync(p);
}

function parseTripleFolderName(name: string) {
  if (!/^\d+$/.test(name)) return name;
  if (name.length % 3 !== 0) return name;
  const partLen = name.length / 3;
  const a = name.slice(0, partLen);
  const b = name.slice(partLen, partLen * 2);
  const c = name.slice(partLen * 2);
  if (a === b && b === c) return a;
  return name;
}

function getImageSortIndex(fileName: string) {
  const match = fileName.match(/\((\d+)\)\.(jpg|jpeg|png|webp)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]);
}

function getGifSortIndex(fileName: string) {
  const match = fileName.match(/^(\d+)\.(jpg|jpeg|png|webp)$/i);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]);
}

async function getImportOwnerId() {
  const user = await prisma.user.findFirst({
    where: { email: IMPORT_OWNER_EMAIL },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error(`未找到导入归属账号：${IMPORT_OWNER_EMAIL}。请先注册这个账号，或者把脚本里的 IMPORT_OWNER_EMAIL 改成你现有账号邮箱。`);
  }

  return user.id;
}

async function copyFile(src: string, dest: string) {
  await fsp.copyFile(src, dest);
}

async function importImageAlbums(authorId: number) {
  if (!fileExists(LEGACY_IMAGES_ROOT)) {
    console.log("未找到旧图集目录，跳过图集导入。");
    return;
  }

  const albumDirs = (await fsp.readdir(LEGACY_IMAGES_ROOT, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dirName of albumDirs) {
    const legacyId = parseTripleFolderName(dirName);
    const sourceKey = `legacy:images:${legacyId}`;

    const exists = await prisma.work.findFirst({
      where: { sourceKey },
      select: { id: true },
    });

    if (exists) {
      console.log(`跳过已导入图集: ${sourceKey}`);
      continue;
    }

    const fullDir = path.join(LEGACY_IMAGES_ROOT, dirName);
    const files = (await fsp.readdir(fullDir))
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort((a, b) => getImageSortIndex(a) - getImageSortIndex(b));

    if (files.length === 0) {
      console.log(`空图集，跳过: ${dirName}`);
      continue;
    }

    const work = await prisma.work.create({
      data: {
        title: `图集 ${legacyId}`,
        type: "FOLDER",
        authorId,
        sourceKey,
      },
    });

    const workFiles: { workId: number; fileUrl: string; sortOrder: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const src = path.join(fullDir, fileName);
      const ext = path.extname(fileName).toLowerCase();
      const newFileName = `legacy_folder_${work.id}_${i}${ext}`;
      const dest = path.join(NEW_FOLDER_ROOT, newFileName);

      await copyFile(src, dest);

      workFiles.push({
        workId: work.id,
        fileUrl: `/uploads/works/folders/${newFileName}`,
        sortOrder: i,
      });
    }

    await prisma.workFile.createMany({ data: workFiles });

    await prisma.work.update({
      where: { id: work.id },
      data: {
        coverUrl: workFiles[0].fileUrl,
      },
    });

    console.log(`已导入图集: ${sourceKey}`);
  }
}

async function importGifSequences(authorId: number) {
  if (!fileExists(LEGACY_GIFS_ROOT)) {
    console.log("未找到旧动图目录，跳过动图导入。");
    return;
  }

  const gifDirs = (await fsp.readdir(LEGACY_GIFS_ROOT, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dirName of gifDirs) {
    const match = dirName.match(/^gif(\d+)$/i);
    const legacyId = match ? match[1] : dirName;
    const sourceKey = `legacy:gifs:${legacyId}`;

    const exists = await prisma.work.findFirst({
      where: { sourceKey },
      select: { id: true },
    });

    if (exists) {
      console.log(`跳过已导入动图: ${sourceKey}`);
      continue;
    }

    const fullDir = path.join(LEGACY_GIFS_ROOT, dirName);
    const files = (await fsp.readdir(fullDir))
      .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .sort((a, b) => getGifSortIndex(a) - getGifSortIndex(b));

    if (files.length === 0) {
      console.log(`空动图序列，跳过: ${dirName}`);
      continue;
    }

    const work = await prisma.work.create({
      data: {
        title: `动图 ${legacyId}`,
        type: "GIF",
        authorId,
        sourceKey,
      },
    });

    const workFiles: { workId: number; fileUrl: string; sortOrder: number }[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const src = path.join(fullDir, fileName);
      const ext = path.extname(fileName).toLowerCase();
      const newFileName = `legacy_gif_${work.id}_${i}${ext}`;
      const dest = path.join(NEW_GIF_ROOT, newFileName);

      await copyFile(src, dest);

      workFiles.push({
        workId: work.id,
        fileUrl: `/uploads/works/gifs/${newFileName}`,
        sortOrder: i,
      });
    }

    await prisma.workFile.createMany({ data: workFiles });

    await prisma.work.update({
      where: { id: work.id },
      data: {
        coverUrl: workFiles[0].fileUrl,
      },
    });

    console.log(`已导入动图: ${sourceKey}`);
  }
}

async function importVideos(authorId: number) {
  if (!fileExists(LEGACY_VIDEOS_ROOT)) {
    console.log("未找到旧视频目录，跳过视频导入。");
    return;
  }

  const videoFiles = (await fsp.readdir(LEGACY_VIDEOS_ROOT))
    .filter((f) => /\.(mp4|mov|webm|mkv)$/i.test(f))
    .sort((a, b) => {
      const an = Number(path.parse(a).name);
      const bn = Number(path.parse(b).name);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return an - bn;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
    });

  for (const fileName of videoFiles) {
    const legacyId = path.parse(fileName).name;
    const sourceKey = `legacy:videos:${legacyId}`;

    const exists = await prisma.work.findFirst({
      where: { sourceKey },
      select: { id: true },
    });

    if (exists) {
      console.log(`跳过已导入视频: ${sourceKey}`);
      continue;
    }

    const src = path.join(LEGACY_VIDEOS_ROOT, fileName);
    const ext = path.extname(fileName).toLowerCase();

    const work = await prisma.work.create({
      data: {
        title: `视频 ${legacyId}`,
        type: "VIDEO",
        authorId,
        sourceKey,
      },
    });

    const newFileName = `legacy_video_${work.id}${ext}`;
    const dest = path.join(NEW_VIDEO_ROOT, newFileName);

    await copyFile(src, dest);

    const fileUrl = `/uploads/works/videos/${newFileName}`;

    await prisma.workFile.create({
      data: {
        workId: work.id,
        fileUrl,
        sortOrder: 0,
      },
    });

    await prisma.work.update({
      where: { id: work.id },
      data: {
        coverUrl: fileUrl,
      },
    });

    console.log(`已导入视频: ${sourceKey}`);
  }
}

async function main() {
  await ensureDirs();
  const authorId = await getImportOwnerId();

  console.log("开始导入旧资源...");
  await importImageAlbums(authorId);
  await importGifSequences(authorId);
  await importVideos(authorId);
  console.log("全部导入完成。");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });