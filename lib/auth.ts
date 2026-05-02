import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "beautyfun_token";

function getJwtSecret() {
  return process.env.JWT_SECRET || "beautyfun-local-secret-123456";
}

export type SessionUser = {
  id: number;
  account: string;
  nickname: string;
  role: "BASIC" | "GOLD" | "ADMIN";
};

export function signAuthToken(user: SessionUser) {
  return jwt.sign(user, getJwtSecret(), {
    expiresIn: "7d",
  });
}

export function verifyAuthToken(token: string): SessionUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as SessionUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyAuthToken(token);
  if (!payload) return null;

const user = await prisma.user.findUnique({
  where: { id: payload.id },
  select: {
    id: true,
    account: true,
    nickname: true,
    avatarUrl: true,
    role: true,
    xp: true,
  },
});

  return user;
}