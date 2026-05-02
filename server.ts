import { createServer } from "http";
import next from "next";
import { Server as IOServer } from "socket.io";
import { prisma } from "./lib/prisma";
import { getSocketSessionUser } from "./lib/socket/auth";
import {
  buildGroupRoom,
  buildPrivateRoom,
  buildUserRoom,
} from "./lib/socket/rooms";
import { setSocketServer } from "./lib/socket/server";

const port = Number(process.env.PORT || 3000);
const dev = !process.argv.includes("--prod");
const app = next({ dev, hostname: "0.0.0.0", port });
const handle = app.getRequestHandler();

async function canJoinPrivate(currentUserId: number, targetUserId: number) {
  const user1Id = Math.min(currentUserId, targetUserId);
  const user2Id = Math.max(currentUserId, targetUserId);

  const friendship = await prisma.friendship.findUnique({
    where: {
      user1Id_user2Id: {
        user1Id,
        user2Id,
      },
    },
    select: { id: true },
  });

  return !!friendship;
}

async function canJoinGroup(currentUserId: number, groupId: number) {
  const membership = await prisma.groupChatMember.findFirst({
    where: {
      groupId,
      userId: currentUserId,
    },
    select: { id: true },
  });

  return !!membership;
}

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new IOServer(httpServer, {
    path: "/socket.io",
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  setSocketServer(io);

  io.use(async (socket, nextSocket) => {
    try {
      const user = await getSocketSessionUser(socket.request.headers.cookie || "");
      if (!user) {
        nextSocket(new Error("未登录"));
        return;
      }

      socket.data.user = user;
      nextSocket();
    } catch (error) {
      nextSocket(error instanceof Error ? error : new Error("鉴权失败"));
    }
  });

  io.on("connection", (socket) => {
    const currentUser = socket.data.user;
    if (!currentUser) {
      socket.disconnect(true);
      return;
    }

    socket.join(buildUserRoom(currentUser.id));

    socket.on("private:join", async (payload: { targetUserId?: number }) => {
      const targetUserId = Number(payload?.targetUserId);
      if (!targetUserId || Number.isNaN(targetUserId)) return;
      if (!(await canJoinPrivate(currentUser.id, targetUserId))) return;

      socket.join(buildPrivateRoom(currentUser.id, targetUserId));
    });

    socket.on("private:leave", (payload: { targetUserId?: number }) => {
      const targetUserId = Number(payload?.targetUserId);
      if (!targetUserId || Number.isNaN(targetUserId)) return;
      socket.leave(buildPrivateRoom(currentUser.id, targetUserId));
    });

    socket.on(
      "private:typing",
      async (payload: { targetUserId?: number; isTyping?: boolean }) => {
        const targetUserId = Number(payload?.targetUserId);
        if (!targetUserId || Number.isNaN(targetUserId)) return;
        if (!(await canJoinPrivate(currentUser.id, targetUserId))) return;

        io.to(buildUserRoom(targetUserId)).emit("private:typing", {
          fromUserId: currentUser.id,
          targetUserId,
          isTyping: !!payload?.isTyping,
        });
      }
    );

    socket.on("group:join", async (payload: { groupId?: number }) => {
      const groupId = Number(payload?.groupId);
      if (!groupId || Number.isNaN(groupId)) return;
      if (!(await canJoinGroup(currentUser.id, groupId))) return;

      socket.join(buildGroupRoom(groupId));
    });

    socket.on("group:leave", (payload: { groupId?: number }) => {
      const groupId = Number(payload?.groupId);
      if (!groupId || Number.isNaN(groupId)) return;
      socket.leave(buildGroupRoom(groupId));
    });

    socket.on(
      "group:typing",
      async (payload: { groupId?: number; isTyping?: boolean }) => {
        const groupId = Number(payload?.groupId);
        if (!groupId || Number.isNaN(groupId)) return;
        if (!(await canJoinGroup(currentUser.id, groupId))) return;

        socket.to(buildGroupRoom(groupId)).emit("group:typing", {
          groupId,
          userId: currentUser.id,
          isTyping: !!payload?.isTyping,
        });
      }
    );
  });

  httpServer.listen(port, () => {
    console.log(
      `> BeautyFun custom server ready on http://0.0.0.0:${port} (${dev ? "dev" : "prod"})`
    );
  });
});
