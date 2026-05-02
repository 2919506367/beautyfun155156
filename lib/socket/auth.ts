import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

export type SocketSessionUser = {
  id: number;
  account: string;
  nickname: string;
  role: "BASIC" | "GOLD" | "ADMIN";
};

type JwtPayloadLike = {
  id?: number | string;
  userId?: number | string;
  sub?: number | string;
};

function parseCookieHeader(cookieHeader: string) {
  const map = new Map<string, string>();

  cookieHeader
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index <= 0) return;

      const key = decodeURIComponent(part.slice(0, index).trim());
      const value = decodeURIComponent(part.slice(index + 1).trim());
      map.set(key, value);
    });

  return map;
}

const AUTH_COOKIE_NAME = "beautyfun_token";

function getJwtSecret() {
  return process.env.JWT_SECRET || "beautyfun-local-secret-123456";
}

function extractUserIdFromTokenPayload(payload: JwtPayloadLike) {
  const raw = payload.id ?? payload.userId ?? payload.sub;
  const userId = Number(raw);
  if (!userId || Number.isNaN(userId)) return null;
  return userId;
}

export async function getSocketSessionUser(
  cookieHeader: string
): Promise<SocketSessionUser | null> {
  const cookieMap = parseCookieHeader(cookieHeader);
  const token = cookieMap.get(AUTH_COOKIE_NAME);

  if (!token) return null;

  let decoded: JwtPayloadLike;
  try {
    decoded = jwt.verify(token, getJwtSecret()) as JwtPayloadLike;
  } catch {
    return null;
  }

  const userId = extractUserIdFromTokenPayload(decoded);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      account: true,
      nickname: true,
      role: true,
    },
  });

  if (!user) return null;

  return user;
}