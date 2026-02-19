import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyAccessToken } from "./mobile-jwt";

interface AuthenticatedSocket extends Socket {
  userId?: number;
  userEmail?: string;
  userRole?: string;
}

export function createWebSocketServer(httpServer: HttpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*", // Em produção, especificar domínios permitidos
      methods: ["GET", "POST"],
      credentials: true,
    },
    path: "/socket.io/",
  });

  // Middleware de autenticação
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const payload = await verifyAccessToken(token);
      
      if (!payload) {
        return next(new Error("Invalid or expired token"));
      }

      // Adicionar informações do usuário ao socket
      socket.userId = payload.userId;
      socket.userEmail = payload.email;
      socket.userRole = payload.role;

      next();
    } catch (error) {
      console.error("WebSocket authentication error:", error);
      next(new Error("Authentication failed"));
    }
  });

  // Conexão estabelecida
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`[WebSocket] User connected: ${socket.userEmail} (ID: ${socket.userId})`);

    // Entrar na sala do usuário (para notificações pessoais)
    socket.join(`user:${socket.userId}`);

    // Evento: Cliente solicita entrar em uma conversa
    socket.on("conversation:join", (conversationId: number) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`[WebSocket] User ${socket.userId} joined conversation ${conversationId}`);
    });

    // Evento: Cliente sai de uma conversa
    socket.on("conversation:leave", (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`[WebSocket] User ${socket.userId} left conversation ${conversationId}`);
    });

    // Evento: Nova mensagem enviada
    socket.on("message:send", async (data: {
      conversationId: number;
      content: string;
      messageType?: string;
      attachmentUrl?: string;
    }) => {
      try {
        // Broadcast para todos na conversa
        io.to(`conversation:${data.conversationId}`).emit("message:new", {
          conversationId: data.conversationId,
          senderId: socket.userId,
          senderName: socket.userEmail,
          senderType: "agent",
          content: data.content,
          messageType: data.messageType || "text",
          attachmentUrl: data.attachmentUrl,
          createdAt: new Date().toISOString(),
        });

        console.log(`[WebSocket] Message sent in conversation ${data.conversationId} by user ${socket.userId}`);
      } catch (error) {
        console.error("[WebSocket] Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Evento: Mensagens marcadas como lidas
    socket.on("message:read", (data: { conversationId: number }) => {
      io.to(`conversation:${data.conversationId}`).emit("message:read", {
        conversationId: data.conversationId,
        userId: socket.userId,
      });
    });

    // Evento: Usuário está digitando
    socket.on("typing:start", (data: { conversationId: number }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:start", {
        conversationId: data.conversationId,
        userId: socket.userId,
        userName: socket.userEmail,
      });
    });

    // Evento: Usuário parou de digitar
    socket.on("typing:stop", (data: { conversationId: number }) => {
      socket.to(`conversation:${data.conversationId}`).emit("typing:stop", {
        conversationId: data.conversationId,
        userId: socket.userId,
      });
    });

    // Desconexão
    socket.on("disconnect", () => {
      console.log(`[WebSocket] User disconnected: ${socket.userEmail} (ID: ${socket.userId})`);
    });
  });

  // Funções auxiliares para emitir eventos do servidor

  // Notificar nova reserva
  function notifyNewBooking(userId: number, booking: any) {
    io.to(`user:${userId}`).emit("booking:created", booking);
  }

  // Notificar atualização de reserva
  function notifyBookingUpdate(userId: number, booking: any) {
    io.to(`user:${userId}`).emit("booking:updated", booking);
  }

  // Notificar cancelamento de reserva
  function notifyBookingCancelled(userId: number, bookingId: number) {
    io.to(`user:${userId}`).emit("booking:cancelled", { id: bookingId });
  }

  // Notificar pagamento completado
  function notifyPaymentCompleted(userId: number, payment: any) {
    io.to(`user:${userId}`).emit("payment:completed", payment);
  }

  // Notificar reembolso
  function notifyPaymentRefunded(userId: number, payment: any) {
    io.to(`user:${userId}`).emit("payment:refunded", payment);
  }

  // Notificar nova escalação
  function notifyNewEscalation(escalation: any) {
    // Notificar todos os admins
    io.emit("escalation:created", escalation);
  }

  // Notificar escalação resolvida
  function notifyEscalationResolved(escalation: any) {
    io.emit("escalation:resolved", escalation);
  }

  // Notificar nova mensagem de cliente (externa)
  function notifyNewClientMessage(conversationId: number, message: any) {
    io.to(`conversation:${conversationId}`).emit("message:new", message);
  }

  return {
    io,
    notifyNewBooking,
    notifyBookingUpdate,
    notifyBookingCancelled,
    notifyPaymentCompleted,
    notifyPaymentRefunded,
    notifyNewEscalation,
    notifyEscalationResolved,
    notifyNewClientMessage,
  };
}

// Tipo exportado para uso em outros arquivos
export type WebSocketServer = ReturnType<typeof createWebSocketServer>;
