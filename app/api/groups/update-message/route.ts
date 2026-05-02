import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

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

    const body = await req.json();
    const messageId = Number(body.messageId);
    const action = String(body.action || "").trim();
    const content = String(body.content || "").trim();

    if (!messageId || Number.isNaN(messageId)) {
      return NextResponse.json({ error: "消息无效" }, { status: 400 });
    }

    const message = await prisma.groupMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        senderId: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: "消息不存在" }, { status: 404 });
    }

    if (message.senderId !== session.id) {
      return NextResponse.json({ error: "只能编辑或删除自己的消息" }, { status: 403 });
    }

    if (action === "delete") {
      await prisma.groupMessage.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: "[该消息已删除]",
          editedAt: new Date(),
        },
      });

      return NextResponse.json({ ok: true, message: "删除成功" });
    }

    if (action === "edit") {
      if (!content) {
        return NextResponse.json({ error: "修改后的内容不能为空" }, { status: 400 });
      }

      await prisma.groupMessage.update({
        where: { id: messageId },
        data: {
          content,
          editedAt: new Date(),
        },
      });

      return NextResponse.json({ ok: true, message: "修改成功" });
    }

    return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
  } catch (error) {
    console.error("group update message error:", error);
    return NextResponse.json({ error: "更新群消息失败" }, { status: 500 });
  }
}