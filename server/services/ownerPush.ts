import webpush, { type PushSubscription } from "web-push";
import { and, desc, eq, gt, lt } from "drizzle-orm";

import { db, isDatabaseConfigured } from "../db";
import { ownerPushDeliveries, ownerPushSubscriptions } from "@shared/models/auth";
import {
  buildOwnerDeskSnapshot,
  type OwnerDeskAlert,
  type OwnerDeskFollowUp,
} from "./ownerDesk";

const OWNER_PUSH_CHANNEL = "owner_desk";
const PUSH_ALERT_COOLDOWN_MS = 45 * 60 * 1000;
const PUSH_FOLLOW_UP_COOLDOWN_MS = 60 * 60 * 1000;
const PUSH_LOOP_INTERVAL_MS = Math.max(30_000, Number(process.env.OWNER_PUSH_POLL_INTERVAL_MS || 60_000));

type OwnerPushPayload = {
  title: string;
  body: string;
  tag: string;
  url: string;
  category: "alert" | "follow_up" | "test";
  level?: "critical" | "attention" | "info";
  icon?: string;
  badge?: string;
};

type PushQueueItem = {
  fingerprint: string;
  cooldownMs: number;
  payload: OwnerPushPayload;
};

let ownerPushLoopStarted = false;
let ownerPushLoopRunning = false;

function ownerPushConfig() {
  const publicKey = process.env.OWNER_PUSH_PUBLIC_KEY?.trim() || "";
  const privateKey = process.env.OWNER_PUSH_PRIVATE_KEY?.trim() || "";
  const subject = process.env.OWNER_PUSH_SUBJECT?.trim() || "mailto:noreply@michelstravel.agency";

  return {
    publicKey,
    privateKey,
    subject,
    configured: Boolean(publicKey && privateKey),
  };
}

function ensureOwnerPushConfigured() {
  const config = ownerPushConfig();
  if (!config.configured) {
    return false;
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

function mobileActionUrlFromAlert(alert: OwnerDeskAlert) {
  if (alert.liveSessionId) {
    return `/admin-app?tab=vendas&session=${alert.liveSessionId}`;
  }

  if (alert.threadId) {
    return `/admin-app?tab=mensagens&thread=${alert.threadId}`;
  }

  return "/admin-app?tab=alertas";
}

function mobileActionUrlFromFollowUp(followUp: OwnerDeskFollowUp) {
  if (followUp.liveSessionId) {
    return `/admin-app?tab=vendas&session=${followUp.liveSessionId}`;
  }

  if (followUp.threadId) {
    return `/admin-app?tab=mensagens&thread=${followUp.threadId}`;
  }

  return "/admin-app?tab=alertas";
}

function payloadFromAlert(alert: OwnerDeskAlert): OwnerPushPayload {
  const body = [alert.customerName, alert.route, alert.summary].filter(Boolean).join(" • ");
  return {
    title: alert.title,
    body,
    tag: alert.id,
    url: mobileActionUrlFromAlert(alert),
    category: "alert",
    level: alert.level,
    icon: "/icons/icon-192.png",
    badge: "/favicon.png",
  };
}

function payloadFromFollowUp(item: OwnerDeskFollowUp): OwnerPushPayload {
  const body = [item.customerName, item.route, item.reason].filter(Boolean).join(" • ");
  return {
    title: item.overdue ? "Follow-up vencido no Owner Desk" : "Follow-up chegando no Owner Desk",
    body,
    tag: item.id,
    url: mobileActionUrlFromFollowUp(item),
    category: "follow_up",
    icon: "/icons/icon-192.png",
    badge: "/favicon.png",
  };
}

function buildPushQueue() {
  return async (): Promise<PushQueueItem[]> => {
    const snapshot = await buildOwnerDeskSnapshot();
    const alerts = snapshot.alerts
      .filter((item) => item.level === "critical" || item.level === "attention")
      .slice(0, 4)
      .map<PushQueueItem>((item) => ({
        fingerprint: `alert:${item.id}`,
        cooldownMs: PUSH_ALERT_COOLDOWN_MS,
        payload: payloadFromAlert(item),
      }));

    const followUps = snapshot.followUps
      .filter((item) => item.urgency !== "planned")
      .slice(0, 4)
      .map<PushQueueItem>((item) => ({
        fingerprint: `follow-up:${item.id}:${item.urgency}`,
        cooldownMs: PUSH_FOLLOW_UP_COOLDOWN_MS,
        payload: payloadFromFollowUp(item),
      }));

    return [...alerts, ...followUps];
  };
}

async function wasRecentlyDelivered(subscriptionId: string, fingerprint: string, cooldownMs: number) {
  const threshold = new Date(Date.now() - cooldownMs);
  const [delivery] = await db
    .select()
    .from(ownerPushDeliveries)
    .where(
      and(
        eq(ownerPushDeliveries.subscriptionId, subscriptionId),
        eq(ownerPushDeliveries.fingerprint, fingerprint),
        gt(ownerPushDeliveries.deliveredAt, threshold),
      ),
    )
    .orderBy(desc(ownerPushDeliveries.deliveredAt))
    .limit(1);

  return Boolean(delivery);
}

async function markDelivery(subscriptionId: string, item: PushQueueItem) {
  await db.insert(ownerPushDeliveries).values({
    subscriptionId,
    fingerprint: item.fingerprint,
    category: item.payload.category,
    payload: item.payload,
  });

  await db
    .update(ownerPushSubscriptions)
    .set({
      lastNotifiedAt: new Date(),
      lastSeenAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(ownerPushSubscriptions.id, subscriptionId));
}

async function deactivatePushEndpoint(subscriptionId: string) {
  await db
    .update(ownerPushSubscriptions)
    .set({
      active: false,
      updatedAt: new Date(),
    })
    .where(eq(ownerPushSubscriptions.id, subscriptionId));
}

export function getOwnerPushPublicKey() {
  return ownerPushConfig().publicKey;
}

export function ownerPushAvailable() {
  return ownerPushConfig().configured;
}

export async function upsertOwnerPushSubscription(input: {
  endpoint: string;
  subscription: PushSubscription;
  deviceLabel?: string | null;
  platform?: string | null;
  userAgent?: string | null;
}) {
  const [existing] = await db
    .select()
    .from(ownerPushSubscriptions)
    .where(eq(ownerPushSubscriptions.endpoint, input.endpoint))
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(ownerPushSubscriptions)
      .set({
        subscription: input.subscription,
        deviceLabel: input.deviceLabel ?? existing.deviceLabel,
        platform: input.platform ?? existing.platform,
        userAgent: input.userAgent ?? existing.userAgent,
        active: true,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(ownerPushSubscriptions.id, existing.id))
      .returning();

    return updated;
  }

  const [created] = await db
    .insert(ownerPushSubscriptions)
    .values({
      channel: OWNER_PUSH_CHANNEL,
      endpoint: input.endpoint,
      subscription: input.subscription,
      deviceLabel: input.deviceLabel ?? null,
      platform: input.platform ?? null,
      userAgent: input.userAgent ?? null,
      active: true,
      lastSeenAt: new Date(),
    })
    .returning();

  return created;
}

export async function deactivateOwnerPushSubscription(endpoint: string) {
  await db
    .update(ownerPushSubscriptions)
    .set({
      active: false,
      updatedAt: new Date(),
    })
    .where(eq(ownerPushSubscriptions.endpoint, endpoint));
}

export async function sendOwnerPushTest(endpoint: string) {
  if (!ensureOwnerPushConfigured()) {
    throw new Error("Owner push is not configured");
  }

  const [subscriptionRow] = await db
    .select()
    .from(ownerPushSubscriptions)
    .where(
      and(
        eq(ownerPushSubscriptions.endpoint, endpoint),
        eq(ownerPushSubscriptions.active, true),
      ),
    )
    .limit(1);

  if (!subscriptionRow) {
    throw new Error("Push subscription not found");
  }

  const payload: OwnerPushPayload = {
    title: "Owner Desk ligado",
    body: "Seu celular ja pode receber alertas reais do atendimento Michels Travel.",
    tag: `owner-push-test-${subscriptionRow.id}`,
    url: "/admin-app?tab=alertas",
    category: "test",
    level: "info",
    icon: "/icons/icon-192.png",
    badge: "/favicon.png",
  };

  await webpush.sendNotification(subscriptionRow.subscription as PushSubscription, JSON.stringify(payload));

  await markDelivery(subscriptionRow.id, {
    fingerprint: `test:${subscriptionRow.id}`,
    cooldownMs: 0,
    payload,
  });
}

export async function dispatchOwnerPushNow() {
  if (!ensureOwnerPushConfigured()) {
    return { sent: 0, skipped: 0, inactive: 0, available: false };
  }

  const queue = await buildPushQueue()();
  if (queue.length === 0) {
    return { sent: 0, skipped: 0, inactive: 0, available: true };
  }

  const subscriptions = await db
    .select()
    .from(ownerPushSubscriptions)
    .where(
      and(
        eq(ownerPushSubscriptions.channel, OWNER_PUSH_CHANNEL),
        eq(ownerPushSubscriptions.active, true),
      ),
    );

  let sent = 0;
  let skipped = 0;
  let inactive = 0;

  for (const subscriptionRow of subscriptions) {
    for (const item of queue) {
      if (await wasRecentlyDelivered(subscriptionRow.id, item.fingerprint, item.cooldownMs)) {
        skipped += 1;
        continue;
      }

      try {
        await webpush.sendNotification(
          subscriptionRow.subscription as PushSubscription,
          JSON.stringify(item.payload),
        );
        await markDelivery(subscriptionRow.id, item);
        sent += 1;
      } catch (error: any) {
        const statusCode = Number(error?.statusCode || error?.status);
        console.error("[OWNER PUSH] send failed:", statusCode || "unknown", error?.body || error?.message || error);

        if ([404, 410].includes(statusCode)) {
          await deactivatePushEndpoint(subscriptionRow.id);
          inactive += 1;
          break;
        }

        skipped += 1;
      }
    }
  }

  return {
    sent,
    skipped,
    inactive,
    available: true,
  };
}

async function ownerPushLoopTick() {
  if (ownerPushLoopRunning) {
    return;
  }

  ownerPushLoopRunning = true;

  try {
    await dispatchOwnerPushNow();

    const retentionThreshold = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    await db
      .delete(ownerPushDeliveries)
      .where(
        and(
          eq(ownerPushDeliveries.category, "test"),
          lt(ownerPushDeliveries.deliveredAt, retentionThreshold),
        ),
      );
  } catch (error) {
    console.error("[OWNER PUSH] loop tick failed:", error);
  } finally {
    ownerPushLoopRunning = false;
  }
}

export function startOwnerPushLoop() {
  if (ownerPushLoopStarted) {
    return;
  }

  if (!isDatabaseConfigured()) {
    console.warn("[OWNER PUSH] DATABASE_URL not configured, skipping owner push loop");
    return;
  }

  ownerPushLoopStarted = true;

  const run = async () => {
    await ownerPushLoopTick();
    setTimeout(run, PUSH_LOOP_INTERVAL_MS);
  };

  setTimeout(run, 10_000);
}
