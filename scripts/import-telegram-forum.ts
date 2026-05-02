import "dotenv/config";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

const DEFAULT_IMPORT_DIR = "D:/Telegram_export_media";
const DEFAULT_TITLE = "来源于网络";

type MetaMap = Record<string, string>;

type PreparedMedia = {
  type: "IMAGE" | "VIDEO";
  url: string;
  sortOrder: number;
};

function normalizeText(input: string): string {
  return input.replace(/\r\n/g, "\n").trim();
}

function buildTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return DEFAULT_TITLE;
  return clean.slice(0, 40);
}

function parseMeta(content: string): MetaMap {
  const result: MetaMap = {};
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const idx = line.indexOf(":");
    if (idx === -1) continue;

    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();

    if (key) result[key] = value;
  }

  return result;
}

function parseTelegramDate(raw?: string): Date {
  if (!raw) return new Date();
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return new Date();
  return date;
}

function isImageFile(name: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif)$/i.test(name);
}

function isVideoFile(name: string): boolean {
  return /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(name);
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function listFilesSafe(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  } catch {
    return [];
  }
}

async function copyForumMedia(sourceFile: string, targetFolder = "forum/telegram") {
  const ext = path.extname(sourceFile) || "";
  const safeName = `${crypto.randomUUID()}${ext}`;
  const relativeDir = path.join("uploads", targetFolder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);

  await ensureDir(absoluteDir);

  const targetAbsolutePath = path.join(absoluteDir, safeName);
  await fs.copyFile(sourceFile, targetAbsolutePath);

  return `/${relativeDir.replace(/\\/g, "/")}/${safeName}`;
}

async function prepareMediaItems(folderPath: string): Promise<PreparedMedia[]> {
  const imagesDir = path.join(folderPath, "images");
  const videosDir = path.join(folderPath, "videos");

  const imageNames = (await listFilesSafe(imagesDir)).filter(isImageFile);
  const videoNames = (await listFilesSafe(videosDir)).filter(isVideoFile);

  const prepared: PreparedMedia[] = [];
  let sortOrder = 0;

  for (const fileName of imageNames) {
    const absoluteSource = path.join(imagesDir, fileName);
    const url = await copyForumMedia(absoluteSource);
    prepared.push({
      type: "IMAGE",
      url,
      sortOrder,
    });
    sortOrder += 1;
  }

  for (const fileName of videoNames) {
    const absoluteSource = path.join(videosDir, fileName);
    const url = await copyForumMedia(absoluteSource);
    prepared.push({
      type: "VIDEO",
      url,
      sortOrder,
    });
    sortOrder += 1;
  }

  return prepared;
}

async function getImportAuthorId(): Promise<number> {
  const preferredAccount = String(process.env.TELEGRAM_SYNC_AUTHOR_ACCOUNT || "").trim();

  if (preferredAccount) {
    const matched = await prisma.user.findFirst({
      where: { account: preferredAccount },
      select: { id: true },
    });

    if (matched) return matched.id;
  }

  const firstAdmin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { id: "asc" },
    select: { id: true, account: true },
  });

  if (!firstAdmin) {
    throw new Error("没有找到管理员账号，无法导入论坛帖子。");
  }

  return firstAdmin.id;
}

async function importOneFolder(folderPath: string, authorId: number) {
  const folderName = path.basename(folderPath);

  const metaPath = path.join(folderPath, "meta.txt");
  const textPath = path.join(folderPath, "text.txt");

  let metaText = "";
  let textText = "";

  try {
    metaText = await fs.readFile(metaPath, "utf8");
  } catch {
    console.log(`[跳过] ${folderName} 缺少 meta.txt`);
    return;
  }

  try {
    textText = await fs.readFile(textPath, "utf8");
  } catch {
    textText = "";
  }

  const meta = parseMeta(metaText);
  const content = normalizeText(textText);
  const title = buildTitle(content);
  const createdAt = parseTelegramDate(meta.date);

  const telegramChatId = meta.chat || null;
  const telegramMessageId = meta.message_id ? Number(meta.message_id) : null;
  const telegramGroupedId = meta.grouped_id || null;
  const telegramPostUrl = meta.url || null;

  if (telegramChatId && telegramMessageId) {
    const existing = await prisma.forumPost.findUnique({
      where: {
        telegramChatId_telegramMessageId: {
          telegramChatId,
          telegramMessageId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      console.log(`[跳过] ${folderName} 已导入，postId=${existing.id}`);
      return;
    }
  }

  const mediaItems = await prepareMediaItems(folderPath);

  if (!content && mediaItems.length === 0) {
    console.log(`[跳过] ${folderName} 没有正文也没有媒体`);
    return;
  }

  const post = await prisma.forumPost.create({
    data: {
      title: title || DEFAULT_TITLE,
      content,
      coverUrl: mediaItems[0]?.url || null,
      mediaCount: mediaItems.length,
      category: "综合",
      ageRating: "ALL_AGES",
      isPinned: false,
      telegramChatId,
      telegramMessageId,
      telegramGroupedId,
      telegramPostUrl,
      importedFrom: "telegram-export",
      importedAt: new Date(),
      createdAt,
      authorId,
      mediaItems: {
        create: mediaItems.map((item) => ({
          type: item.type,
          url: item.url,
          sortOrder: item.sortOrder,
        })),
      },
    },
    select: {
      id: true,
      title: true,
    },
  });

  console.log(`[导入成功] ${folderName} -> postId=${post.id} -> ${post.title}`);
}

async function main() {
  const importDirArg = process.argv[2]?.trim();
  const importDir = importDirArg || DEFAULT_IMPORT_DIR;

  const absoluteImportDir = path.resolve(importDir);

  console.log(`开始导入 Telegram 目录：${absoluteImportDir}`);

  const dirEntries = await fs.readdir(absoluteImportDir, { withFileTypes: true });
  const messageFolders = dirEntries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (messageFolders.length === 0) {
    console.log("没有找到可导入的消息文件夹。");
    return;
  }

  const authorId = await getImportAuthorId();
  console.log(`使用作者 ID：${authorId}`);

  let successCount = 0;
  let failedCount = 0;

  for (const folderName of messageFolders) {
    const folderPath = path.join(absoluteImportDir, folderName);

    try {
      await importOneFolder(folderPath, authorId);
      successCount += 1;
    } catch (error) {
      failedCount += 1;
      console.error(`[导入失败] ${folderName}`, error);
    }
  }

  console.log("------------");
  console.log(`导入结束：成功 ${successCount}，失败 ${failedCount}`);
}

main()
  .catch((error) => {
    console.error("批量导入失败：", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });