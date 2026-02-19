import { Router, Request, Response } from "express";
import { validateAccessToken } from "./mobile-auth-routes";
import * as bookingsDb from "./mobile-bookings-db";
import * as authDb from "./mobile-auth-db";

export const mobileApiRouter = Router();

// Aplicar validação de token em todas as rotas
mobileApiRouter.use(validateAccessToken);

// ===== DASHBOARD =====

// GET /api/mobile/dashboard/stats
mobileApiRouter.get("/dashboard/stats", async (req: Request, res: Response) => {
  try {
    const stats = await bookingsDb.getDashboardStats();
    
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar estatísticas",
    });
  }
});

// GET /api/mobile/dashboard/recent-activity
mobileApiRouter.get("/dashboard/recent-activity", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await bookingsDb.getRecentActivity(limit);
    
    return res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Recent activity error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar atividades recentes",
    });
  }
});

// ===== BOOKINGS =====

// GET /api/mobile/bookings
mobileApiRouter.get("/bookings", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string;
    
    let bookings;
    if (status) {
      bookings = await bookingsDb.getBookingsByStatus(status, limit);
    } else {
      bookings = await bookingsDb.getAllBookings(undefined, limit, offset);
    }
    
    return res.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Get bookings error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar reservas",
    });
  }
});

// GET /api/mobile/bookings/:id
mobileApiRouter.get("/bookings/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const booking = await bookingsDb.getBookingById(id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: "Reserva não encontrada",
      });
    }
    
    // Buscar pagamentos relacionados
    const payments = await bookingsDb.getPaymentsByBookingId(id);
    
    return res.json({
      success: true,
      data: {
        ...booking,
        payments,
      },
    });
  } catch (error) {
    console.error("Get booking error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar reserva",
    });
  }
});

// POST /api/mobile/bookings
mobileApiRouter.post("/bookings", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const bookingData = {
      ...req.body,
      userId: user.id,
    };
    
    const bookingId = await bookingsDb.createBooking(bookingData);
    
    // Registrar atividade
    await authDb.logMobileActivity({
      userId: user.id,
      action: "create_booking",
      entityType: "booking",
      entityId: bookingId,
      details: JSON.stringify({ flightNumber: bookingData.flightNumber }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    return res.json({
      success: true,
      data: { id: bookingId },
    });
  } catch (error) {
    console.error("Create booking error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao criar reserva",
    });
  }
});

// PUT /api/mobile/bookings/:id
mobileApiRouter.put("/bookings/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = (req as any).user;
    
    await bookingsDb.updateBooking(id, req.body);
    
    // Registrar atividade
    await authDb.logMobileActivity({
      userId: user.id,
      action: "update_booking",
      entityType: "booking",
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    return res.json({
      success: true,
      message: "Reserva atualizada com sucesso",
    });
  } catch (error) {
    console.error("Update booking error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao atualizar reserva",
    });
  }
});

// DELETE /api/mobile/bookings/:id
mobileApiRouter.delete("/bookings/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = (req as any).user;
    
    await bookingsDb.deleteBooking(id);
    
    // Registrar atividade
    await authDb.logMobileActivity({
      userId: user.id,
      action: "delete_booking",
      entityType: "booking",
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    return res.json({
      success: true,
      message: "Reserva deletada com sucesso",
    });
  } catch (error) {
    console.error("Delete booking error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao deletar reserva",
    });
  }
});

// ===== MESSAGES =====

// GET /api/mobile/messages (conversas)
mobileApiRouter.get("/messages", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const conversations = await bookingsDb.getAllConversations(limit, offset);
    
    return res.json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar conversas",
    });
  }
});

// GET /api/mobile/messages/:conversationId
mobileApiRouter.get("/messages/:conversationId", async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const limit = parseInt(req.query.limit as string) || 100;
    
    const conversation = await bookingsDb.getConversationById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: "Conversa não encontrada",
      });
    }
    
    const messages = await bookingsDb.getMessagesByConversationId(conversationId, limit);
    
    return res.json({
      success: true,
      data: {
        conversation,
        messages,
      },
    });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar mensagens",
    });
  }
});

// POST /api/mobile/messages
mobileApiRouter.post("/messages", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { conversationId, content, messageType, attachmentUrl } = req.body;
    
    const messageId = await bookingsDb.createMessage({
      conversationId,
      senderId: user.id,
      senderType: "agent",
      senderName: user.name,
      content,
      messageType: messageType || "text",
      attachmentUrl,
    });
    
    return res.json({
      success: true,
      data: { id: messageId },
    });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao enviar mensagem",
    });
  }
});

// PUT /api/mobile/messages/:conversationId/read
mobileApiRouter.put("/messages/:conversationId/read", async (req: Request, res: Response) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    
    await bookingsDb.markMessagesAsRead(conversationId);
    
    return res.json({
      success: true,
      message: "Mensagens marcadas como lidas",
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao marcar mensagens como lidas",
    });
  }
});

// ===== ESCALATIONS =====

// GET /api/mobile/escalations
mobileApiRouter.get("/escalations", async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const pending = req.query.pending === "true";
    
    let escalations;
    if (pending) {
      escalations = await bookingsDb.getPendingEscalations();
    } else {
      escalations = await bookingsDb.getAllEscalations(limit, offset);
    }
    
    return res.json({
      success: true,
      data: escalations,
    });
  } catch (error) {
    console.error("Get escalations error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar escalações",
    });
  }
});

// GET /api/mobile/escalations/:id
mobileApiRouter.get("/escalations/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const escalation = await bookingsDb.getEscalationById(id);
    
    if (!escalation) {
      return res.status(404).json({
        success: false,
        error: "Escalação não encontrada",
      });
    }
    
    return res.json({
      success: true,
      data: escalation,
    });
  } catch (error) {
    console.error("Get escalation error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao buscar escalação",
    });
  }
});

// PUT /api/mobile/escalations/:id/resolve
mobileApiRouter.put("/escalations/:id/resolve", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = (req as any).user;
    const { resolution } = req.body;
    
    await bookingsDb.updateEscalation(id, {
      status: "resolved",
      resolution,
      resolvedByUserId: user.id,
      resolvedAt: new Date(),
    });
    
    // Registrar atividade
    await authDb.logMobileActivity({
      userId: user.id,
      action: "resolve_escalation",
      entityType: "escalation",
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    return res.json({
      success: true,
      message: "Escalação resolvida com sucesso",
    });
  } catch (error) {
    console.error("Resolve escalation error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao resolver escalação",
    });
  }
});

// ===== PAYMENTS =====

// POST /api/mobile/payments
mobileApiRouter.post("/payments", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const paymentData = {
      ...req.body,
      userId: user.id,
    };
    
    const paymentId = await bookingsDb.createPayment(paymentData);
    
    // Se pagamento foi completado, atualizar status da reserva
    if (paymentData.status === "completed") {
      await bookingsDb.updateBooking(paymentData.bookingId, {
        paymentStatus: "paid",
      });
    }
    
    // Registrar atividade
    await authDb.logMobileActivity({
      userId: user.id,
      action: "create_payment",
      entityType: "payment",
      entityId: paymentId,
      details: JSON.stringify({ bookingId: paymentData.bookingId }),
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    return res.json({
      success: true,
      data: { id: paymentId },
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao criar pagamento",
    });
  }
});

// POST /api/mobile/payments/:id/refund
mobileApiRouter.post("/payments/:id/refund", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = (req as any).user;
    
    await bookingsDb.updatePayment(id, {
      status: "refunded",
    });
    
    // Registrar atividade
    await authDb.logMobileActivity({
      userId: user.id,
      action: "refund_payment",
      entityType: "payment",
      entityId: id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    
    return res.json({
      success: true,
      message: "Reembolso processado com sucesso",
    });
  } catch (error) {
    console.error("Refund payment error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao processar reembolso",
    });
  }
});

// ===== NOTIFICATIONS =====

// POST /api/mobile/notifications/register
mobileApiRouter.post("/notifications/register", async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { token, platform } = req.body;
    
    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        error: "Token e plataforma são obrigatórios",
      });
    }
    
    await authDb.registerPushToken({
      userId: user.id,
      token,
      platform,
    });
    
    return res.json({
      success: true,
      message: "Token de notificação registrado com sucesso",
    });
  } catch (error) {
    console.error("Register push token error:", error);
    return res.status(500).json({
      success: false,
      error: "Erro ao registrar token de notificação",
    });
  }
});
