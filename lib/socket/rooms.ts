export function buildUserRoom(userId: number) {
  return `user:${userId}`;
}

export function buildPrivateRoom(userIdA: number, userIdB: number) {
  const a = Math.min(userIdA, userIdB);
  const b = Math.max(userIdA, userIdB);
  return `private:${a}:${b}`;
}

export function buildGroupRoom(groupId: number) {
  return `group:${groupId}`;
}
