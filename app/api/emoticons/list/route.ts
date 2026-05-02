import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ items: [] });
    }

    const session = verifyAuthToken(token);
    if (!session) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.emoticon.findMany({
      where: {
        ownerId: session.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        label: true,
        imageUrl: true,
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("list emoticons error:", error);
    return NextResponse.json({ items: [] });
  }
}