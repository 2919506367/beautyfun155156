export function canRedeemMembership(role: "BASIC" | "GOLD" | "ADMIN") {
  return role === "BASIC";
}

export function isHigherRole(role: "BASIC" | "GOLD" | "ADMIN") {
  return role === "GOLD" || role === "ADMIN";
}

export function randomCdk(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}