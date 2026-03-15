import type { Express, NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { and, desc, eq, gt, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "../db";
import {
  customerMobileDevices,
  customerMobileRefreshTokens,
  customerProfiles,
  users,
} from "@shared/models/auth";

const MOBILE_ACCESS_TOKEN_TTL_SECONDS = 60 * 15;
const MOBILE_REFRESH_TOKEN_TTL_DAYS = 30;
const MOBILE_JWT_SECRET = process.env.MOBILE_JWT_SECRET || process.env.SESSION_SECRET;

if (!MOBILE_JWT_SECRET) {
  throw new Error("MOBILE_JWT_SECRET or SESSION_SECRET must be configured");
}

const authMethodSchema = z.enum(["email", "phone"]);

const deviceSchema = z.object({
  id: z.string().uuid().optional(),
  platform: z.enum(["ios", "android", "web"]),
  storeChannel: z.enum(["app_store", "play_store", "galaxy_store", "internal", "direct"]).default("direct"),
  appVariant: z.enum(["standard", "senior"]).default("standard"),
  deviceName: z.string().max(160).optional(),
  deviceModel: z.string().max(160).optional(),
  osVersion: z.string().max(80).optional(),
  appVersion: z.string().max(40).optional(),
  pushToken: z.string().max(500).optional(),
});

const loginSchema = z.object({
  method: authMethodSchema,
  identifier: z.string().min(1),
  password: z.string().min(1),
  device: deviceSchema,
}).superRefine((value, ctx) => {
  if (value.method === "email") {
    if (!z.string().email().safeParse(value.identifier.trim()).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["identifier"], message: "Invalid email address" });
    }
    return;
  }

  if (!normalizePhone(value.identifier)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["identifier"], message: "Invalid phone number" });
  }
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().max(80).optional(),
  method: authMethodSchema,
  identifier: z.string().min(1),
  password: z.string().min(6).max(120),
  device: deviceSchema,
}).superRefine((value, ctx) => {
  if (value.method === "email") {
    if (!z.string().email().safeParse(value.identifier.trim()).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["identifier"], message: "Invalid email address" });
    }
    return;
  }

  if (!normalizePhone(value.identifier)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["identifier"], message: "Invalid phone number" });
  }
});

const registerDeviceSchema = z.object({
  id: z.string().uuid().optional(),
  platform: z.enum(["ios", "android", "web"]).optional(),
  storeChannel: z.enum(["app_store", "play_store", "galaxy_store", "internal", "direct"]).optional(),
  appVariant: z.enum(["standard", "senior"]).optional(),
  deviceName: z.string().max(160).optional(),
  deviceModel: z.string().max(160).optional(),
  osVersion: z.string().max(80).optional(),
  appVersion: z.string().max(40).optional(),
  pushToken: z.string().max(500).nullable().optional(),
  markTrusted: z.boolean().optional(),
});

const profilePatchSchema = z.object({
  experienceMode: z.enum(["standard", "senior"]).optional(),
  preferredLanguage: z.enum(["pt", "en", "es"]).optional(),
  preferredAirport: z.string().max(12).nullable().optional(),
  savedPassengers: z.array(z.record(z.any())).max(12).optional(),
  connectionTolerance: z.enum(["avoid", "one_stop", "balanced", "price_first"]).optional(),
  bagsPreference: z.enum(["checked", "carry", "flexible"]).optional(),
  needsHumanHelp: z.boolean().optional(),
  biometricEnabled: z.boolean().optional(),
  scannerHandoffEnabled: z.boolean().optional(),
  seniorAssistantEnabled: z.boolean().optional(),
  lastActiveBookingId: z.number().int().positive().nullable().optional(),
  lastActiveOfferId: z.string().max(120).nullable().optional(),
});

type CustomerMobileAuth = {
  userId: string;
  email: string;
  deviceId: string;
  appVariant: "standard" | "senior";
};

type CustomerMobileRequest = Request & {
  customerMobileAuth?: CustomerMobileAuth;
};

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateRefreshToken() {
  return crypto.randomBytes(48).toString("base64url");
}

function signAccessToken(payload: CustomerMobileAuth) {
  return jwt.sign(
    {
      sub: payload.userId,
      email: payload.email,
      deviceId: payload.deviceId,
      appVariant: payload.appVariant,
      type: "customer_mobile_access",
    },
    MOBILE_JWT_SECRET!,
    { expiresIn: MOBILE_ACCESS_TOKEN_TTL_SECONDS },
  );
}

function readBearerToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

function normalizeRouteParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length < 10 || digits.length > 15) {
    return null;
  }

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  if (digits.startsWith("00")) {
    return `+${digits.slice(2)}`;
  }

  return digits;
}

function buildPhoneCandidates(value: string) {
  const digits = value.replace(/\D/g, "");
  const withPlus = digits ? `+${digits}` : "";
  return Array.from(new Set([value, digits, withPlus].filter(Boolean)));
}

function serializeUser(user: typeof users.$inferSelect) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    profileImageUrl: user.profileImageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function buildProfileSeedFromVariant(appVariant: "standard" | "senior") {
  if (appVariant === "senior") {
    return {
      experienceMode: "senior" as const,
      preferredLanguage: "pt" as const,
      needsHumanHelp: true,
      seniorAssistantEnabled: true,
    };
  }

  return undefined;
}

function serializeProfile(profile: typeof customerProfiles.$inferSelect) {
  return {
    experienceMode: profile.experienceMode,
    preferredLanguage: profile.preferredLanguage,
    preferredAirport: profile.preferredAirport,
    savedPassengers: profile.savedPassengers,
    connectionTolerance: profile.connectionTolerance,
    bagsPreference: profile.bagsPreference,
    needsHumanHelp: profile.needsHumanHelp,
    biometricEnabled: profile.biometricEnabled,
    scannerHandoffEnabled: profile.scannerHandoffEnabled,
    seniorAssistantEnabled: profile.seniorAssistantEnabled,
    lastActiveBookingId: profile.lastActiveBookingId,
    lastActiveOfferId: profile.lastActiveOfferId,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function serializeDevice(device: typeof customerMobileDevices.$inferSelect) {
  return {
    id: device.id,
    platform: device.platform,
    storeChannel: device.storeChannel,
    appVariant: device.appVariant,
    deviceName: device.deviceName,
    deviceModel: device.deviceModel,
    osVersion: device.osVersion,
    appVersion: device.appVersion,
    hasPushToken: Boolean(device.pushToken),
    trustedAt: device.trustedAt,
    lastSeenAt: device.lastSeenAt,
    revokedAt: device.revokedAt,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  };
}

async function ensureCustomerProfile(
  userId: string,
  seed: Partial<typeof customerProfiles.$inferInsert> = {},
) {
  const [existing] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.userId, userId));

  if (existing) {
    return existing;
  }

  const [created] = await db
    .insert(customerProfiles)
    .values({ userId, ...seed })
    .returning();

  return created;
}

async function findUserByEmail(email: string) {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)));

  return user;
}

async function findUserByPhone(phone: string) {
  const normalizedTarget = normalizePhone(phone);

  for (const candidate of buildPhoneCandidates(phone)) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.phone, candidate));

    if (user) {
      return user;
    }
  }

  if (normalizedTarget) {
    const phoneUsers = await db
      .select()
      .from(users)
      .where(isNotNull(users.phone));

    return phoneUsers.find((user) => normalizePhone(user.phone || "") === normalizedTarget);
  }

  return undefined;
}

async function revokeActiveRefreshTokensForDevice(deviceId: string) {
  await db
    .update(customerMobileRefreshTokens)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(customerMobileRefreshTokens.deviceId, deviceId),
        isNull(customerMobileRefreshTokens.revokedAt),
      ),
    );
}

async function issueSession(user: typeof users.$inferSelect, device: typeof customerMobileDevices.$inferSelect) {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + MOBILE_REFRESH_TOKEN_TTL_DAYS);

  await revokeActiveRefreshTokensForDevice(device.id);

  await db.insert(customerMobileRefreshTokens).values({
    userId: user.id,
    deviceId: device.id,
    tokenHash: refreshTokenHash,
    expiresAt: refreshExpiry,
  });

  const accessToken = signAccessToken({
    userId: user.id,
    email: user.email || "",
    deviceId: device.id,
    appVariant: (device.appVariant as "standard" | "senior") || "standard",
  });

  return {
    accessToken,
    refreshToken,
    expiresInSeconds: MOBILE_ACCESS_TOKEN_TTL_SECONDS,
    refreshExpiresAt: refreshExpiry.toISOString(),
  };
}

async function requireCustomerMobileAuth(req: CustomerMobileRequest, res: Response, next: NextFunction) {
  const token = readBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, MOBILE_JWT_SECRET!) as {
      sub: string;
      email: string;
      deviceId: string;
      appVariant: "standard" | "senior";
      type: string;
    };

    if (decoded.type !== "customer_mobile_access") {
      return res.status(401).json({ error: "Invalid token type" });
    }

    const [device] = await db
      .select()
      .from(customerMobileDevices)
      .where(
        and(
          eq(customerMobileDevices.id, decoded.deviceId),
          eq(customerMobileDevices.userId, decoded.sub),
          isNull(customerMobileDevices.revokedAt),
        ),
      );

    if (!device) {
      return res.status(401).json({ error: "Device session revoked" });
    }

    await db
      .update(customerMobileDevices)
      .set({ lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(customerMobileDevices.id, device.id));

    req.customerMobileAuth = {
      userId: decoded.sub,
      email: decoded.email,
      deviceId: decoded.deviceId,
      appVariant: decoded.appVariant,
    };

    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function upsertDeviceForUser(userId: string, payload: z.infer<typeof deviceSchema>) {
  if (payload.id) {
    const [existing] = await db
      .select()
      .from(customerMobileDevices)
      .where(
        and(
          eq(customerMobileDevices.id, payload.id),
          eq(customerMobileDevices.userId, userId),
        ),
      );

    if (existing) {
      const [updated] = await db
        .update(customerMobileDevices)
        .set({
          platform: payload.platform,
          storeChannel: payload.storeChannel,
          appVariant: payload.appVariant,
          deviceName: payload.deviceName ?? existing.deviceName,
          deviceModel: payload.deviceModel ?? existing.deviceModel,
          osVersion: payload.osVersion ?? existing.osVersion,
          appVersion: payload.appVersion ?? existing.appVersion,
          pushToken: payload.pushToken ?? existing.pushToken,
          trustedAt: existing.trustedAt || new Date(),
          revokedAt: null,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(customerMobileDevices.id, existing.id))
        .returning();

      return updated;
    }
  }

  const [created] = await db
    .insert(customerMobileDevices)
    .values({
      userId,
      platform: payload.platform,
      storeChannel: payload.storeChannel,
      appVariant: payload.appVariant,
      deviceName: payload.deviceName,
      deviceModel: payload.deviceModel,
      osVersion: payload.osVersion,
      appVersion: payload.appVersion,
      pushToken: payload.pushToken,
      trustedAt: new Date(),
      lastSeenAt: new Date(),
    })
    .returning();

  return created;
}

export function registerCustomerMobileRoutes(app: Express) {
  app.post("/api/mobile/customer/auth/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid login payload", details: parsed.error.flatten() });
    }

    const { method, identifier, password, device } = parsed.data;

    const user = method === "email"
      ? await findUserByEmail(identifier)
      : await findUserByPhone(identifier);

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const mobileDevice = await upsertDeviceForUser(user.id, device);
    const profile = await ensureCustomerProfile(user.id, buildProfileSeedFromVariant(device.appVariant));
    const session = await issueSession(user, mobileDevice);

    return res.json({
      user: serializeUser(user),
      profile: serializeProfile(profile),
      device: serializeDevice(mobileDevice),
      session,
    });
  });

  app.post("/api/mobile/customer/auth/register", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid registration payload", details: parsed.error.flatten() });
    }

    const { firstName, lastName, method, identifier, password, device } = parsed.data;
    const email = method === "email" ? normalizeEmail(identifier) : null;
    const phone = method === "phone" ? normalizePhone(identifier) : null;

    if (email && await findUserByEmail(email)) {
      return res.status(409).json({ error: "This email is already registered" });
    }

    if (phone && await findUserByPhone(phone)) {
      return res.status(409).json({ error: "This phone number is already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(users)
      .values({
        firstName,
        lastName: lastName || null,
        email,
        phone,
        passwordHash,
      })
      .returning();

    const mobileDevice = await upsertDeviceForUser(user.id, device);
    const profile = await ensureCustomerProfile(user.id, buildProfileSeedFromVariant(device.appVariant));
    const session = await issueSession(user, mobileDevice);

    return res.status(201).json({
      user: serializeUser(user),
      profile: serializeProfile(profile),
      device: serializeDevice(mobileDevice),
      session,
    });
  });

  app.post("/api/mobile/customer/auth/refresh", async (req, res) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid refresh payload" });
    }

    const tokenHash = hashToken(parsed.data.refreshToken);
    const [refreshTokenRow] = await db
      .select()
      .from(customerMobileRefreshTokens)
      .where(
        and(
          eq(customerMobileRefreshTokens.tokenHash, tokenHash),
          isNull(customerMobileRefreshTokens.revokedAt),
          gt(customerMobileRefreshTokens.expiresAt, new Date()),
        ),
      );

    if (!refreshTokenRow) {
      return res.status(401).json({ error: "Refresh token is invalid or expired" });
    }

    const [device] = await db
      .select()
      .from(customerMobileDevices)
      .where(
        and(
          eq(customerMobileDevices.id, refreshTokenRow.deviceId),
          isNull(customerMobileDevices.revokedAt),
        ),
      );

    if (!device) {
      return res.status(401).json({ error: "Device is no longer trusted" });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, refreshTokenRow.userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await db
      .update(customerMobileRefreshTokens)
      .set({ revokedAt: new Date(), lastUsedAt: new Date() })
      .where(eq(customerMobileRefreshTokens.id, refreshTokenRow.id));

    await db
      .update(customerMobileDevices)
      .set({ lastSeenAt: new Date(), updatedAt: new Date() })
      .where(eq(customerMobileDevices.id, device.id));

    const profile = await ensureCustomerProfile(user.id);
    const session = await issueSession(user, device);

    return res.json({
      user: serializeUser(user),
      profile: serializeProfile(profile),
      device: serializeDevice(device),
      session,
    });
  });

  app.post("/api/mobile/customer/auth/logout", requireCustomerMobileAuth, async (req: CustomerMobileRequest, res) => {
    const auth = req.customerMobileAuth!;
    await revokeActiveRefreshTokensForDevice(auth.deviceId);

    return res.json({ success: true });
  });

  app.get("/api/mobile/customer/me", requireCustomerMobileAuth, async (req: CustomerMobileRequest, res) => {
    const auth = req.customerMobileAuth!;
    const [user] = await db.select().from(users).where(eq(users.id, auth.userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const profile = await ensureCustomerProfile(user.id);
    const [device] = await db
      .select()
      .from(customerMobileDevices)
      .where(eq(customerMobileDevices.id, auth.deviceId));

    return res.json({
      user: serializeUser(user),
      profile: serializeProfile(profile),
      device: device ? serializeDevice(device) : null,
    });
  });

  app.get("/api/mobile/customer/profile", requireCustomerMobileAuth, async (req: CustomerMobileRequest, res) => {
    const profile = await ensureCustomerProfile(req.customerMobileAuth!.userId);
    return res.json({ profile: serializeProfile(profile) });
  });

  app.patch("/api/mobile/customer/profile", requireCustomerMobileAuth, async (req: CustomerMobileRequest, res) => {
    const parsed = profilePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid profile payload", details: parsed.error.flatten() });
    }

    const userId = req.customerMobileAuth!.userId;
    await ensureCustomerProfile(userId);

    const updates = parsed.data;
    const [profile] = await db
      .update(customerProfiles)
      .set({
        experienceMode: updates.experienceMode,
        preferredLanguage: updates.preferredLanguage,
        preferredAirport: updates.preferredAirport === undefined ? undefined : updates.preferredAirport,
        savedPassengers: updates.savedPassengers,
        connectionTolerance: updates.connectionTolerance,
        bagsPreference: updates.bagsPreference,
        needsHumanHelp: updates.needsHumanHelp,
        biometricEnabled: updates.biometricEnabled,
        scannerHandoffEnabled: updates.scannerHandoffEnabled,
        seniorAssistantEnabled: updates.seniorAssistantEnabled,
        lastActiveBookingId: updates.lastActiveBookingId === undefined ? undefined : updates.lastActiveBookingId,
        lastActiveOfferId: updates.lastActiveOfferId === undefined ? undefined : updates.lastActiveOfferId,
        updatedAt: new Date(),
      })
      .where(eq(customerProfiles.userId, userId))
      .returning();

    return res.json({ profile: serializeProfile(profile) });
  });

  app.get("/api/mobile/customer/devices", requireCustomerMobileAuth, async (req: CustomerMobileRequest, res) => {
    const devices = await db
      .select()
      .from(customerMobileDevices)
      .where(eq(customerMobileDevices.userId, req.customerMobileAuth!.userId))
      .orderBy(desc(customerMobileDevices.createdAt));

    return res.json({ devices: devices.map(serializeDevice) });
  });

  app.post("/api/mobile/customer/devices/register", requireCustomerMobileAuth, async (req: CustomerMobileRequest, res) => {
    const parsed = registerDeviceSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid device payload", details: parsed.error.flatten() });
    }

    const auth = req.customerMobileAuth!;
    const payload = parsed.data;

    if (!payload.id && !payload.platform) {
      return res.status(400).json({ error: "Device platform is required for new device registration" });
    }

    let device: typeof customerMobileDevices.$inferSelect | undefined;

    if (payload.id) {
      const [existing] = await db
        .select()
        .from(customerMobileDevices)
        .where(
          and(
            eq(customerMobileDevices.id, payload.id),
            eq(customerMobileDevices.userId, auth.userId),
          ),
        );

      if (existing) {
        const [updated] = await db
          .update(customerMobileDevices)
          .set({
            platform: payload.platform ?? existing.platform,
            storeChannel: payload.storeChannel ?? existing.storeChannel,
            appVariant: payload.appVariant ?? existing.appVariant,
            deviceName: payload.deviceName ?? existing.deviceName,
            deviceModel: payload.deviceModel ?? existing.deviceModel,
            osVersion: payload.osVersion ?? existing.osVersion,
            appVersion: payload.appVersion ?? existing.appVersion,
            pushToken: payload.pushToken === undefined ? existing.pushToken : payload.pushToken,
            trustedAt: payload.markTrusted ? new Date() : existing.trustedAt,
            revokedAt: null,
            lastSeenAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(customerMobileDevices.id, existing.id))
          .returning();
        device = updated;
      }
    }

    if (!device) {
      const [created] = await db
        .insert(customerMobileDevices)
        .values({
          userId: auth.userId,
          platform: payload.platform!,
          storeChannel: payload.storeChannel || "direct",
          appVariant: payload.appVariant || auth.appVariant,
          deviceName: payload.deviceName,
          deviceModel: payload.deviceModel,
          osVersion: payload.osVersion,
          appVersion: payload.appVersion,
          pushToken: payload.pushToken ?? null,
          trustedAt: payload.markTrusted ? new Date() : null,
          lastSeenAt: new Date(),
        })
        .returning();
      device = created;
    }

    return res.status(201).json({ device: serializeDevice(device) });
  });

  app.post("/api/mobile/customer/devices/:deviceId/revoke", requireCustomerMobileAuth, async (req: CustomerMobileRequest, res) => {
    const auth = req.customerMobileAuth!;
    const deviceId = normalizeRouteParam(req.params.deviceId);

    if (!deviceId) {
      return res.status(400).json({ error: "Device id is required" });
    }

    const [device] = await db
      .select()
      .from(customerMobileDevices)
      .where(
        and(
          eq(customerMobileDevices.id, deviceId),
          eq(customerMobileDevices.userId, auth.userId),
        ),
      );

    if (!device) {
      return res.status(404).json({ error: "Device not found" });
    }

    const [updated] = await db
      .update(customerMobileDevices)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(customerMobileDevices.id, deviceId))
      .returning();

    await revokeActiveRefreshTokensForDevice(deviceId);

    return res.json({ device: serializeDevice(updated) });
  });
}
