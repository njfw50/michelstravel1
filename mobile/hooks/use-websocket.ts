import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";

const WS_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";

interface WebSocketHookReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  sendMessage: (conversationId: number, content: string, messageType?: string, attachmentUrl?: string) => void;
  markAsRead: (conversationId: number) => void;
  startTyping: (conversationId: number) => void;
  stopTyping: (conversationId: number) => void;
}

export function useWebSocket(): WebSocketHookReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let socket: Socket | null = null;

    const connectWebSocket = async () => {
      try {
        // Obter token de acesso
        const token = await SecureStore.getItemAsync("accessToken");
        
        if (!token) {
          console.log("[WebSocket] No access token found, skipping connection");
          return;
        }

        // Criar conexão WebSocket
        socket = io(WS_URL, {
          auth: {
            token,
          },
          transports: ["websocket", "polling"],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        socketRef.current = socket;

        // Eventos de conexão
        socket.on("connect", () => {
          console.log("[WebSocket] Connected to server");
          setIsConnected(true);
        });

        socket.on("disconnect", (reason) => {
          console.log("[WebSocket] Disconnected:", reason);
          setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
          console.error("[WebSocket] Connection error:", error.message);
          setIsConnected(false);
        });

        socket.on("error", (error) => {
          console.error("[WebSocket] Error:", error);
        });

      } catch (error) {
        console.error("[WebSocket] Setup error:", error);
      }
    };

    connectWebSocket();

    // Cleanup
    return () => {
      if (socket) {
        console.log("[WebSocket] Disconnecting...");
        socket.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  // Entrar em uma conversa
  const joinConversation = useCallback((conversationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("conversation:join", conversationId);
      console.log(`[WebSocket] Joined conversation ${conversationId}`);
    }
  }, []);

  // Sair de uma conversa
  const leaveConversation = useCallback((conversationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("conversation:leave", conversationId);
      console.log(`[WebSocket] Left conversation ${conversationId}`);
    }
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback((
    conversationId: number,
    content: string,
    messageType: string = "text",
    attachmentUrl?: string
  ) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("message:send", {
        conversationId,
        content,
        messageType,
        attachmentUrl,
      });
      console.log(`[WebSocket] Message sent to conversation ${conversationId}`);
    }
  }, []);

  // Marcar mensagens como lidas
  const markAsRead = useCallback((conversationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("message:read", { conversationId });
    }
  }, []);

  // Indicar que está digitando
  const startTyping = useCallback((conversationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing:start", { conversationId });
    }
  }, []);

  // Parar de indicar digitação
  const stopTyping = useCallback((conversationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing:stop", { conversationId });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  };
}

// Hook para escutar eventos específicos
export function useWebSocketEvent<T = any>(
  eventName: string,
  callback: (data: T) => void
) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [socket, eventName, callback]);
}
