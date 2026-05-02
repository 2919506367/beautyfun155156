import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const account  = String(body.account  || "").trim().toLowerCase();
    const role = String(body.role || "").trim() as "BASIC" | "GOLD" | "ADMIN";

    if (!account ) {
      return NextResponse.json({ error: "账号不能为空" }, { status: 400 });
    }

    if (!["BASIC", "GOLD", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "角色不合法" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { account  },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    const updatedUser = await prisma.user.update({
      where: { account  },
      data: { role },
      select: {
        id: true,
        account : true,
        nickname: true,
        role: true,
      },
    });

    return NextResponse.json({
      ok: true,
      message: "角色修改成功",
      user: updatedUser,
    });
  } catch (error) {
    console.error("set role error:", error);
    return NextResponse.json({ error: "角色修改失败" }, { status: 500 });
  }
}