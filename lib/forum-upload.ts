import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function saveForumUpload(file: File, folder = "forum") {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || "";
  const safeName = crypto.randomUUID() + ext;
  const relativeDir = path.join("uploads", folder);
  const absoluteDir = path.join(process.cwd(), "public", relativeDir);

  await mkdir(absoluteDir, { recursive: true });

  const absolutePath = path.join(absoluteDir, safeName);
  await writeFile(absolutePath, buffer);

  return `/${relativeDir.replace(/\\/g, "/")}/${safeName}`;
}