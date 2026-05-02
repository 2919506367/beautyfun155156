import { prisma } from "../lib/prisma";

async function main() {
  const result = await prisma.work.updateMany({
    data: {
      ageRating: "AGE_16_PLUS",
    },
  });

  console.log("更新完成：", result);
}

main()
  .catch((error) => {
    console.error("更新失败：", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });