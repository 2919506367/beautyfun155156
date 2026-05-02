import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma";

type WorkType = "FOLDER" | "GIF" | "VIDEO";

const CONFIG = {
  AUTHOR_EMAIL: "999999",

  SOURCE_IMAGES_DIR: "D:/HtmlServer/SerHtml/content/Images",
  SOURCE_GIFS_DIR: "D:/HtmlServer/SerHtml/content/Gifs",
  SOURCE_VIDEOS_DIR: "D:/HtmlServer/SerHtml/content/Videos",

  TARGET_PUBLIC_ROOT: path.join(process.cwd(), "public", "imported"),
};

const IMAGE_EXTS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".m4v"]);

type ImportFile = {
  absolutePath: string;
  fileName: string;
};

async function pathExists(targetPath: string) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function sanitizeName(name: string) {
  return name
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .trim();
}

function getExt(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function listSubDirectories(dirPath: string) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(dirPath, entry.name))
    .sort(naturalCompare);
}

async function listFilesInDirectory(dirPath: string, allowedExts: Set<string>) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => ({
      absolutePath: path.join(dirPath, entry.name),
      fileName: entry.name,
    }))
    .filter((file) => allowedExts.has(getExt(file.fileName)))
    .sort((a, b) => naturalCompare(a.fileName, b.fileName));
}

async function listVideoFilesRecursively(dirPath: string): Promise<ImportFile[]> {
  const result: ImportFile[] = [];

  async function walk(current: string) {
    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const abs = path.join(current, entry.name);

      if (entry.isDirectory()) {
        await walk(abs);
      } else if (entry.isFile() && VIDEO_EXTS.has(getExt(entry.name))) {
        result.push({
          absolutePath: abs,
          fileName: entry.name,
        });
      }
    }
  }

  await walk(dirPath);
  result.sort((a, b) => naturalCompare(a.absolutePath, b.absolutePath));
  return result;
}

async function copyFileToPublic(
  sourceFile: string,
  targetDir: string,
  targetName: string
) {
  await ensureDir(targetDir);
  const targetPath = path.join(targetDir, targetName);
  await fs.copyFile(sourceFile, targetPath);
  return targetPath;
}

function toWebPath(absPath: string) {
  const publicRoot = path.join(process.cwd(), "public");
  const rel = path.relative(publicRoot, absPath).replace(/\\/g, "/");
  return `/${rel}`;
}

async function getAuthorId() {
  const user = await prisma.user.findUnique({
    where: { email: CONFIG.AUTHOR_EMAIL },
    select: { id: true, email: true, nickname: true },
  });

  if (!user) {
    throw new Error(`找不到用户：${CONFIG.AUTHOR_EMAIL}。请先注册这个账号。`);
  }

  console.log(`导入归属用户：${user.nickname} <${user.email}>`);
  return user.id;
}

async function alreadyImported(sourceKey: string) {
  const work = await prisma.work.findUnique({
    where: { sourceKey },
    select: { id: true, title: true },
  });

  return work;
}

async function importFolderWork(params: {
  type: WorkType;
  folderPath: string;
  folderName: string;
  sourceKey: string;
  authorId: number;
  targetCategoryDirName: string;
  titlePrefix: string;
}) {
  const existing = await alreadyImported(params.sourceKey);
  if (existing) {
    console.log(`跳过已导入：${existing.title} (${params.sourceKey})`);
    return;
  }

  const files = await listFilesInDirectory(params.folderPath, IMAGE_EXTS);
  if (files.length === 0) {
    console.log(`跳过空文件夹：${params.folderPath}`);
    return;
  }

  const safeFolderName = sanitizeName(params.folderName);
  const targetDir = path.join(
    CONFIG.TARGET_PUBLIC_ROOT,
    params.targetCategoryDirName,
    safeFolderName
  );

  const createdFiles: { fileUrl: string; sortOrder: number }[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const safeFileName = sanitizeName(file.fileName);
    const copied = await copyFileToPublic(file.absolutePath, targetDir, safeFileName);
    createdFiles.push({
      fileUrl: toWebPath(copied),
      sortOrder: i,
    });
  }

  const title = `${params.titlePrefix}${params.folderName}`;
  const coverUrl = createdFiles[0]?.fileUrl ?? null;

  const work = await prisma.work.create({
    data: {
      type: params.type,
      title,
      coverUrl,
      sourceKey: params.sourceKey,
      authorId: params.authorId,
      files: {
        create: createdFiles,
      },
    },
  });

  console.log(`已导入：${title} -> workId=${work.id}`);
}

async function importVideoWork(params: {
  videoFile: ImportFile;
  sourceKey: string;
  authorId: number;
}) {
  const existing = await alreadyImported(params.sourceKey);
  if (existing) {
    console.log(`跳过已导入：${existing.title} (${params.sourceKey})`);
    return;
  }

  const baseName = path.parse(params.videoFile.fileName).name;
  const safeBaseName = sanitizeName(baseName);
  const safeFileName = sanitizeName(params.videoFile.fileName);

  const targetDir = path.join(CONFIG.TARGET_PUBLIC_ROOT, "videos");
  const copied = await copyFileToPublic(
    params.videoFile.absolutePath,
    targetDir,
    `${safeBaseName}${getExt(safeFileName)}`
  );

  const fileUrl = toWebPath(copied);
  const title = `视频 ${baseName}`;

  const work = await prisma.work.create({
    data: {
      type: "VIDEO",
      title,
      coverUrl: fileUrl,
      sourceKey: params.sourceKey,
      authorId: params.authorId,
      files: {
        create: [
          {
            fileUrl,
            sortOrder: 0,
          },
        ],
      },
    },
  });

  console.log(`已导入：${title} -> workId=${work.id}`);
}

async function importImages(authorId: number) {
  if (!(await pathExists(CONFIG.SOURCE_IMAGES_DIR))) {
    console.log(`Images 目录不存在，跳过：${CONFIG.SOURCE_IMAGES_DIR}`);
    return;
  }

  const folders = await listSubDirectories(CONFIG.SOURCE_IMAGES_DIR);

  for (const folderPath of folders) {
    const folderName = path.basename(folderPath);
    const sourceKey = `IMAGE_FOLDER::${folderPath.toLowerCase()}`;

    await importFolderWork({
      type: "FOLDER",
      folderPath,
      folderName,
      sourceKey,
      authorId,
      targetCategoryDirName: "images",
      titlePrefix: "图集 ",
    });
  }
}

async function importGifs(authorId: number) {
  if (!(await pathExists(CONFIG.SOURCE_GIFS_DIR))) {
    console.log(`Gifs 目录不存在，跳过：${CONFIG.SOURCE_GIFS_DIR}`);
    return;
  }

  const folders = await listSubDirectories(CONFIG.SOURCE_GIFS_DIR);

  for (const folderPath of folders) {
    const folderName = path.basename(folderPath);
    const sourceKey = `GIF_FOLDER::${folderPath.toLowerCase()}`;

    await importFolderWork({
      type: "GIF",
      folderPath,
      folderName,
      sourceKey,
      authorId,
      targetCategoryDirName: "gifs",
      titlePrefix: "动图 ",
    });
  }
}

async function importVideos(authorId: number) {
  if (!(await pathExists(CONFIG.SOURCE_VIDEOS_DIR))) {
    console.log(`Videos 目录不存在，跳过：${CONFIG.SOURCE_VIDEOS_DIR}`);
    return;
  }

  const files = await listVideoFilesRecursively(CONFIG.SOURCE_VIDEOS_DIR);

  for (const videoFile of files) {
    const sourceKey = `VIDEO_FILE::${videoFile.absolutePath.toLowerCase()}`;
    await importVideoWork({
      videoFile,
      sourceKey,
      authorId,
    });
  }
}

async function main() {
  console.log("开始批量导入本地资源...");
  console.log("目标 public 目录：", CONFIG.TARGET_PUBLIC_ROOT);

  await ensureDir(CONFIG.TARGET_PUBLIC_ROOT);

  const authorId = await getAuthorId();

  await importImages(authorId);
  await importGifs(authorId);
  await importVideos(authorId);

  console.log("全部导入完成。");
}

main()
  .catch((err) => {
    console.error("导入失败：", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });