import { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { AuthPayload } from "../middlewares/auth";

let io: Server | null = null;

export function initSocket(httpServer: HTTPServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  // JWT authentication middleware for socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const payload = jwt.verify(token as string, config.jwt.secret) as AuthPayload;
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as AuthPayload;
    // Join user-specific room for targeted notifications
    socket.join(`user:${user.userId}`);
    socket.join(`role:${user.role}`);

    socket.on("join-event", (eventId: string) => {
      socket.join(`event:${eventId}`);
    });

    socket.on("leave-event", (eventId: string) => {
      socket.leave(`event:${eventId}`);
    });

    socket.on("disconnect", () => {
      // Cleanup handled by socket.io automatically
    });
  });

  console.log("[Socket.io] Initialized");
  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

export function emitToRole(role: string, event: string, data: any) {
  io?.to(`role:${role}`).emit(event, data);
}

export function emitToEvent(eventId: string, event: string, data: any) {
  io?.to(`event:${eventId}`).emit(event, data);
}
