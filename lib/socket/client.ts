"use client";

import { io, type Socket } from "socket.io-client";

let socketSingleton: Socket | null = null;

export function getChatSocket() {
  if (socketSingleton) {
    return socketSingleton;
  }

  socketSingleton = io({
    path: "/socket.io",
    autoConnect: false,
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  return socketSingleton;
}
