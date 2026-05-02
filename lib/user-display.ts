export type UserRoleType = "BASIC" | "GOLD" | "ADMIN";

export function getRoleLabel(role: UserRoleType) {
  if (role === "GOLD") return "黄金会员";
  if (role === "ADMIN") return "管理员";
  return "普通用户";
}

export function getRoleClassName(role: UserRoleType) {
  if (role === "GOLD") return "role-gold";
  if (role === "ADMIN") return "role-admin";
  return "role-basic";
}

export function getLevelFromXp(xp: number) {
  return Math.floor(xp / 100) + 1;
}

export function getCurrentLevelProgress(xp: number) {
  return xp % 100;
}

export function getNextLevelNeed() {
  return 100;
}