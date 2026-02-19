import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import { 
  mobileUsers, 
  mobileSessions, 
  pushTokens, 
  mobileActivityLog,
  type MobileUser,
  type InsertMobileUser,
  type InsertMobileSession,
  type InsertPushToken,
  type InsertMobileActivityLog
} from "../drizzle/schema";
import * as crypto from "crypto";
import { promisify } from "util";

const scrypt = promisify(crypto.scrypt);

// Funções de hash de senha
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const [salt, key] = hash.split(":");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return key === derivedKey.toString("hex");
}

// Funções de gerenciamento de usuários
export async function createMobileUser(data: InsertMobileUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mobileUsers).values(data);
  return Number((result as any).insertId || 0);
}

export async function getMobileUserByEmail(email: string): Promise<MobileUser | null> {
  const db = await getDb();
  if (!db) return null;
  
  const users = await db.select().from(mobileUsers).where(eq(mobileUsers.email, email)).limit(1);
  return users[0] || null;
}

export async function getMobileUserById(id: number): Promise<MobileUser | null> {
  const db = await getDb();
  if (!db) return null;
  
  const users = await db.select().from(mobileUsers).where(eq(mobileUsers.id, id)).limit(1);
  return users[0] || null;
}

export async function updateMobileUserLastLogin(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(mobileUsers)
    .set({ lastLoginAt: new Date() })
    .where(eq(mobileUsers.id, userId));
}

// Funções de gerenciamento de sessões
export async function createMobileSession(data: InsertMobileSession) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mobileSessions).values(data);
  return Number((result as any).insertId || 0);
}

export async function getMobileSessionByAccessToken(accessToken: string) {
  const db = await getDb();
  if (!db) return null;
  
  const sessions = await db.select()
    .from(mobileSessions)
    .where(eq(mobileSessions.accessToken, accessToken))
    .limit(1);
  
  return sessions[0] || null;
}

export async function getMobileSessionByRefreshToken(refreshToken: string) {
  const db = await getDb();
  if (!db) return null;
  
  const sessions = await db.select()
    .from(mobileSessions)
    .where(eq(mobileSessions.refreshToken, refreshToken))
    .limit(1);
  
  return sessions[0] || null;
}

export async function updateMobileSessionActivity(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(mobileSessions)
    .set({ lastActivityAt: new Date() })
    .where(eq(mobileSessions.id, sessionId));
}

export async function deleteMobileSession(sessionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(mobileSessions).where(eq(mobileSessions.id, sessionId));
}

export async function deleteMobileSessionsByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(mobileSessions).where(eq(mobileSessions.userId, userId));
}

// Funções de gerenciamento de push tokens
export async function registerPushToken(data: InsertPushToken) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Desativar tokens antigos do mesmo usuário e plataforma
  await db.update(pushTokens)
    .set({ active: 0 })
    .where(and(
      eq(pushTokens.userId, data.userId),
      eq(pushTokens.platform, data.platform)
    ));
  
  // Inserir novo token
  const result = await db.insert(pushTokens).values(data);
  return Number((result as any).insertId || 0);
}

export async function getActivePushTokensByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(pushTokens)
    .where(and(
      eq(pushTokens.userId, userId),
      eq(pushTokens.active, 1)
    ));
}

export async function deactivatePushToken(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(pushTokens)
    .set({ active: 0 })
    .where(eq(pushTokens.token, token));
}

// Funções de log de atividades
export async function logMobileActivity(data: InsertMobileActivityLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(mobileActivityLog).values(data);
  return Number((result as any).insertId || 0);
}

export async function getMobileActivityByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select()
    .from(mobileActivityLog)
    .where(eq(mobileActivityLog.userId, userId))
    .orderBy(mobileActivityLog.createdAt)
    .limit(limit);
}
