import Link from "next/link";
import { getLevelFromXp } from "@/lib/user-display";

type UserRoleType = "BASIC" | "GOLD" | "ADMIN";

function normalizeXp(xp?: number | null) {
  if (typeof xp !== "number" || Number.isNaN(xp)) return 0;
  if (!Number.isFinite(xp)) return 0;
  return Math.max(0, Math.floor(xp));
}

function getRoleClassName(role: UserRoleType) {
  if (role === "GOLD") return "role-gold";
  if (role === "ADMIN") return "role-admin";
  return "role-basic";
}

function getRoleLabel(role: UserRoleType) {
  if (role === "GOLD") return "黄金会员";
  if (role === "ADMIN") return "管理员";
  return "普通用户";
}

export default function UserIdentity({
  userId,
  nickname,
  role,
  xp,
  showRole = true,
  showLevel = true,
  linkToProfile = true,
  size = "md",
}: {
  userId?: number | string;
  nickname: string;
  role: UserRoleType;
  xp?: number | null;
  showRole?: boolean;
  showLevel?: boolean;
  linkToProfile?: boolean;
  size?: "sm" | "md";
}) {
  const safeXp = normalizeXp(xp);
  const level = getLevelFromXp(safeXp);
  const roleClass = getRoleClassName(role);

  const nicknameNode = (
    <span
      className={`user-nickname ${roleClass}`}
      style={{
        fontSize: size === "sm" ? 13 : 15,
        lineHeight: 1.2,
      }}
    >
      {nickname}
    </span>
  );

  const roleBadgeNode = showRole ? (
    <span
      className={`user-role-badge ${roleClass}`}
      style={{
        fontSize: size === "sm" ? 11 : 12,
      }}
    >
      {getRoleLabel(role)}
    </span>
  ) : null;

  const levelNode = showLevel ? (
    <span
      className="user-level-badge"
      style={{
        fontSize: size === "sm" ? 11 : 12,
      }}
    >
      Lv.{level}
    </span>
  ) : null;

  const content = (
    <div
      className={`user-identity-group ${roleClass}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        flexWrap: "wrap",
        minWidth: 0,
      }}
    >
      {nicknameNode}
      {roleBadgeNode}
      {levelNode}
    </div>
  );

  if (linkToProfile && userId !== undefined && userId !== null) {
    return (
      <Link href={`/users/${userId}`} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }

  return content;
}