import type { Express, NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";

import {
  deactivateOwnerPushSubscription,
  dispatchOwnerPushNow,
  getOwnerPushPublicKey,
  ownerPushAvailable,
  sendOwnerPushTest,
  upsertOwnerPushSubscription,
} from "../services/ownerPush";

const JWT_SECRET = process.env.SESSION_SECRET!;

const ownerPushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const ownerPushRegisterSchema = z.object({
  subscription: ownerPushSubscriptionSchema,
  deviceLabel: z.string().max(160).nullable().optional(),
  platform: z.string().max(80).nullable().optional(),
  userAgent: z.string().max(1000).nullable().optional(),
});

const ownerPushEndpointSchema = z.object({
  endpoint: z.string().url(),
});

function requireAdminAccess(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any)?.isAdmin) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET) as { role?: string };
      if (decoded.role === "admin") {
        return next();
      }
    } catch {
      // handled below
    }
  }

  return res.status(401).json({ error: "Admin authentication required" });
}

export function registerOwnerPushRoutes(app: Express) {
  app.get("/api/admin/push/public-key", requireAdminAccess, (_req, res) => {
    if (!ownerPushAvailable()) {
      return res.json({ available: false, publicKey: null });
    }

    return res.json({
      available: true,
      publicKey: getOwnerPushPublicKey(),
    });
  });

  app.post("/api/admin/push/subscriptions", requireAdminAccess, async (req, res) => {
    const parsed = ownerPushRegisterSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid push subscription payload", details: parsed.error.flatten() });
    }

    if (!ownerPushAvailable()) {
      return res.status(503).json({ error: "Owner push is not configured" });
    }

    const payload = parsed.data;
    const row = await upsertOwnerPushSubscription({
      endpoint: payload.subscription.endpoint,
      subscription: payload.subscription,
      deviceLabel: payload.deviceLabel,
      platform: payload.platform,
      userAgent: payload.userAgent,
    });

    return res.status(201).json({
      success: true,
      subscriptionId: row.id,
      endpoint: row.endpoint,
    });
  });

  app.delete("/api/admin/push/subscriptions", requireAdminAccess, async (req, res) => {
    const parsed = ownerPushEndpointSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Endpoint is required" });
    }

    await deactivateOwnerPushSubscription(parsed.data.endpoint);
    return res.json({ success: true });
  });

  app.post("/api/admin/push/test", requireAdminAccess, async (req, res) => {
    const parsed = ownerPushEndpointSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Endpoint is required" });
    }

    await sendOwnerPushTest(parsed.data.endpoint);
    return res.json({ success: true });
  });

  app.post("/api/admin/push/dispatch", requireAdminAccess, async (_req, res) => {
    const result = await dispatchOwnerPushNow();
    return res.json(result);
  });
}
