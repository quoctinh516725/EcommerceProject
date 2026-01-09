import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { verify } from "jsonwebtoken";
import { env } from "../config/env";

interface SocketUser {
  userId: string;
  role: string;
}

export class SocketService {
  private static instance: SocketService;
  private io: Server | null = null;

  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: env.NODE_ENV === "production" ? env.FRONTEND_URL : "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.io.use(async (socket, next) => {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      try {
        const decoded = verify(token, env.JWT_ACCESS_SECRET as string);
        (socket as any).user = decoded;
        next();
      } catch (err) {
        next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      console.log("User connected:", socket.id);
      const user = (socket as any).user;

      // Join user specific room
      socket.join(`user_${user.userId}`);
      console.log(`User ${user.userId} joined room user_${user.userId}`);
      // For now, we rely on user_userId since shop owner is a user.

      socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }

  public getIO(): Server {
    if (!this.io) {
      throw new Error("Socket.io not initialized!");
    }
    return this.io;
  }

  public emitToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user_${userId}`).emit(event, data);
    }
  }

  public emitToRoom(room: string, event: string, data: any) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }
}

export const socketService = SocketService.getInstance();
