import type { Server as IOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __beautyfunIO: IOServer | undefined;
}

export function setSocketServer(io: IOServer) {
  globalThis.__beautyfunIO = io;
}

export function getSocketServer() {
  return globalThis.__beautyfunIO;
}
