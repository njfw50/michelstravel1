import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const WS_URL = process.env.EXPO_PUBLIC_API_URL || "https://3000-ibhc3kubcbhrdoemug2dy-ba174052.us1.manus.computer";

interface WebSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  sendMessage: (conversationId: number, content: string, messageType?: string, attachmentUrl?: string) => void;
  markAsRead: (conversationId: number) => void;
  startTyping: (conversationId: number) => void;
  stopTyping: (conversationId: number) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Não conectar WebSocket na web (apenas mobile)
    if (Platform.OS === "web") {
      console.log("[WebSocket] Skipping connection on web platform");
      return;
    }

    let socket: Socket | null = null;

    const connectWebSocket = async () => {
      try {
        // Obter token de acesso
        const token = await SecureStore.getItemAsync("accessToken");
        
        if (!token) {
          console.log("[WebSocket] No access token found, skipping connection");
          return;
        }

        console.log("[WebSocket] Connecting to:", WS_URL);

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
          console.log("[WebSocket] ✅ Connected to server");
          setIsConnected(true);
        });

        socket.on("disconnect", (reason) => {
          console.log("[WebSocket] ❌ Disconnected:", reason);
          setIsConnected(false);
        });

        socket.on("connect_error", (error) => {
          console.error("[WebSocket] ⚠️ Connection error:", error.message);
          setIsConnected(false);
        });

        socket.on("error", (error) => {
          console.error("[WebSocket] ⚠️ Error:", error);
        });

        // Log de eventos recebidos (debug)
        socket.onAny((eventName, ...args) => {
          console.log(`[WebSocket] 📨 Event received: ${eventName}`, args);
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
      console.log(`[WebSocket] 🚪 Joined conversation ${conversationId}`);
    }
  }, []);

  // Sair de uma conversa
  const leaveConversation = useCallback((conversationId: number) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("conversation:leave", conversationId);
      console.log(`[WebSocket] 🚪 Left conversation ${conversationId}`);
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
      console.log(`[WebSocket] 💬 Message sent to conversation ${conversationId}`);
    } else {
      console.warn("[WebSocket] ⚠️ Cannot send message: not connected");
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

  const value: WebSocketContextValue = {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook para usar o contexto WebSocket
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within WebSocketProvider");
  }
  return context;
}

// Hook para escutar eventos específicos
export function useWebSocketEvent<T = any>(
  eventName: string,
  callback: (data: T) => void,
  dependencies: any[] = []
) {
  const { socket } = useWebSocket();

  useEffect(() => {
    if (!socket) return;

    const handler = (data: T) => {
      console.log(`[WebSocket] 📥 ${eventName}:`, data);
      callback(data);
    };

    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName, ...dependencies]);
}
