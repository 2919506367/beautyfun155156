"use client";

import { useEffect, useMemo, useState } from "react";
import { getChatSocket } from "@/lib/socket/client";

export function useChatSocket() {
  const socket = useMemo(() => getChatSocket(), []);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    function handleConnect() {
      setConnected(true);
    }

    function handleDisconnect() {
      setConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    if (!socket.connected) {
      socket.connect();
    } else {
      setConnected(true);
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  return {
    socket,
    connected,
  };
}
