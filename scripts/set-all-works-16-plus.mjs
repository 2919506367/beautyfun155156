import { PrismaClient } from "../generated/prisma/client/index.js";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
});

const prisma = new PrismaClient({ adapter });

try {
  const result = await prisma.work.updateMany({
    data: {
      ageRating: "AGE_16_PLUS",
    },
  });

  console.log("更新完成：", result);
} catch (error) {
  console.error("更新失败：", error);
} finally {
  await prisma.$disconnect();
}