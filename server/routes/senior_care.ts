import type { Express } from "express";
import { storage } from "../storage";

function requireAdmin(req: any, res: any, next: any) {
  const session = (req as any).session;
  if (!session?.isAdmin) {
    return res.status(401).json({ error: "Admin authentication required" });
  }
  next();
}

export function registerSeniorCareRoutes(app: Express) {
  // === SENIOR CARE DESK — dados reais ===
  // GET /api/admin/senior-care
  // Returns senior live sessions + unresolved alerts from the last 48h
  app.get('/api/admin/senior-care', requireAdmin, async (_req, res) => {
    try {
      const [allActiveSessions, allAlerts, requestedSessions] = await Promise.all([
        storage.getActiveLiveSessions(),
        storage.getSeniorAlerts(),
        storage.getLiveSessionRequests(),
      ]);

      const seniorSessions = [...allActiveSessions, ...requestedSessions].filter(
        (s) => (s as any).serviceMode === 'senior'
      );

      const now = new Date();
      const cutoff48h = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const relevantAlerts = allAlerts.filter(
        (a) => a.status !== 'resolved' && a.createdAt && new Date(a.createdAt as any) >= cutoff48h
      );

      res.json({
        seniorSessions: seniorSessions.slice(0, 10).map((s) => ({
          id: s.id,
          customerName: s.customerName,
          customerPhone: s.customerPhone,
          customerEmail: s.customerEmail,
          status: s.status,
          bookingStatus: s.bookingStatus,
          language: s.language,
          createdAt: s.createdAt,
        })),
        alerts: relevantAlerts.slice(0, 20).map((a) => ({
          id: a.id,
          userId: a.userId,
          bookingId: a.bookingId,
          type: a.type,
          status: a.status,
          message: a.message,
          createdAt: a.createdAt,
          resolvedAt: a.resolvedAt,
        })),
        summary: {
          totalSeniorSessions: seniorSessions.length,
          pendingAlerts: relevantAlerts.filter((a) => a.status === 'pending').length,
          inProgressAlerts: relevantAlerts.filter((a) => a.status === 'in_progress').length,
        },
      });
    } catch (error) {
      console.error('Senior care desk error:', error);
      res.status(500).json({ error: 'Failed to load senior care data' });
    }
  });

  // PATCH /api/admin/senior-alerts/:id — resolve or update an alert
  app.patch('/api/admin/senior-alerts/:id', requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid alert ID' });
      const { status, notes, message } = req.body;
      const updated = await storage.updateSeniorAlert(id, { status, message: notes || message });
      if (!updated) return res.status(404).json({ error: 'Alert not found' });
      res.json(updated);
    } catch (error) {
      console.error('Update senior alert error:', error);
      res.status(500).json({ error: 'Failed to update alert' });
    }
  });

  // POST /api/senior-alerts — called from the mobile senior app when user presses help
  app.post('/api/senior-alerts', async (req, res) => {
    try {
      const { userId, bookingId, type, message } = req.body;
      if (!userId || !type) return res.status(400).json({ error: 'userId and type are required' });
      const alert = await storage.createSeniorAlert({
        userId,
        bookingId: bookingId || null,
        type,
        message: message || null,
        status: 'pending',
      });
      res.json(alert);
    } catch (error) {
      console.error('Create senior alert error:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });
}
