import { int, mysqlTable, text, timestamp, varchar, mysqlEnum } from "drizzle-orm/mysql-core";

// Tabela de usuários mobile (administradores e agentes)
export const mobileUsers = mysqlTable("mobile_users", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "agent"]).default("agent").notNull(),
  active: int("active").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
});

// Tabela de sessões mobile (para gerenciar tokens JWT)
export const mobileSessions = mysqlTable("mobile_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accessToken: varchar("accessToken", { length: 500 }).notNull().unique(),
  refreshToken: varchar("refreshToken", { length: 500 }).notNull().unique(),
  expiresAt: timestamp("expiresAt").notNull(),
  refreshExpiresAt: timestamp("refreshExpiresAt").notNull(),
  deviceInfo: text("deviceInfo"), // JSON com info do dispositivo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastActivityAt: timestamp("lastActivityAt").defaultNow().notNull(),
});

// Tabela de tokens push para notificações
export const pushTokens = mysqlTable("push_tokens", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  token: varchar("token", { length: 500 }).notNull().unique(),
  platform: mysqlEnum("platform", ["android", "ios", "web"]).notNull(),
  active: int("active").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Tabela de log de atividades mobile
export const mobileActivityLog = mysqlTable("mobile_activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(), // login, logout, create_booking, etc
  entityType: varchar("entityType", { length: 50 }), // booking, payment, message, etc
  entityId: int("entityId"),
  details: text("details"), // JSON com detalhes adicionais
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Exportar tipos
export type MobileUser = typeof mobileUsers.$inferSelect;
export type InsertMobileUser = typeof mobileUsers.$inferInsert;
export type MobileSession = typeof mobileSessions.$inferSelect;
export type InsertMobileSession = typeof mobileSessions.$inferInsert;
export type PushToken = typeof pushTokens.$inferSelect;
export type InsertPushToken = typeof pushTokens.$inferInsert;
export type MobileActivityLog = typeof mobileActivityLog.$inferSelect;
export type InsertMobileActivityLog = typeof mobileActivityLog.$inferInsert;
