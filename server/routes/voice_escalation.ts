import type { Express, Request, Response } from "express";
import { storage } from "../storage";

function parseRouteId(value: string | string[] | undefined): number {
  const normalizedValue = Array.isArray(value) ? value[0] : value;
  return Number.parseInt(normalizedValue ?? "", 10);
}

export function registerVoiceEscalationRoutes(app: Express) {
  // Handle escalation from voice assistant
  app.post("/api/voice/escalate", async (req: Request, res: Response) => {
    try {
      const { reason, customerPhone, summary, callSid } = req.body;
      
      console.log('[Voice Escalation] New escalation:', {
        reason,
        customerPhone,
        callSid
      });
      
      // Store escalation in database
      const escalation = await storage.createVoiceEscalation({
        type: 'voice',
        reason,
        customerPhone,
        summary,
        callSid,
        status: 'pending'
      });
      
      // Send Facebook Messenger notification
      // This will be implemented in the next phase
      try {
        await sendFacebookNotification({
          escalationId: escalation.id,
          reason,
          customerPhone,
          summary
        });
      } catch (error) {
        console.error('[Voice Escalation] Failed to send Facebook notification:', error);
        // Continue even if notification fails
      }
      
      res.json({
        success: true,
        escalationId: escalation.id,
        message: 'Escalation recorded successfully'
      });
      
    } catch (error: any) {
      console.error('[Voice Escalation] Error:', error);
      res.status(500).json({
        error: 'Failed to process escalation',
        message: error.message
      });
    }
  });
  
  // Get all escalations (for admin dashboard)
  app.get("/api/voice/escalations", async (req: Request, res: Response) => {
    try {
      const escalations = await storage.getAllVoiceEscalations();
      res.json(escalations);
    } catch (error: any) {
      console.error('[Voice Escalation] Error fetching escalations:', error);
      res.status(500).json({
        error: 'Failed to fetch escalations',
        message: error.message
      });
    }
  });
  
  // Update escalation status
  app.patch("/api/voice/escalations/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      const updates: any = { status };
      if (notes) updates.notes = notes;
      if (status === 'resolved') updates.resolvedAt = new Date();
      
      const escalation = await storage.updateVoiceEscalation(parseRouteId(id), updates);
      
      res.json(escalation);
    } catch (error: any) {
      console.error('[Voice Escalation] Error updating escalation:', error);
      res.status(500).json({
        error: 'Failed to update escalation',
        message: error.message
      });
    }
  });
}

async function sendFacebookNotification(data: {
  escalationId: number;
  reason: string;
  customerPhone?: string;
  summary?: string;
}) {
  const FACEBOOK_PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const FACEBOOK_RECIPIENT_ID = process.env.FACEBOOK_RECIPIENT_ID;
  
  if (!FACEBOOK_PAGE_ACCESS_TOKEN || !FACEBOOK_RECIPIENT_ID) {
    console.warn('[Facebook] Missing credentials. Set FACEBOOK_PAGE_ACCESS_TOKEN and FACEBOOK_RECIPIENT_ID');
    return;
  }
  
  const message = `🚨 *Escalação de Chamada Telefônica*

*Motivo:* ${data.reason}
${data.customerPhone ? `*Telefone do Cliente:* ${data.customerPhone}` : ''}
${data.summary ? `\n*Resumo:*\n${data.summary}` : ''}

*ID da Escalação:* #${data.escalationId}

Por favor, entre em contato com o cliente o mais rápido possível.`;
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${FACEBOOK_PAGE_ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipient: {
            id: FACEBOOK_RECIPIENT_ID
          },
          message: {
            text: message
          }
        })
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Facebook API error: ${JSON.stringify(error)}`);
    }
    
    console.log('[Facebook] Notification sent successfully');
  } catch (error) {
    console.error('[Facebook] Failed to send notification:', error);
    throw error;
  }
}
