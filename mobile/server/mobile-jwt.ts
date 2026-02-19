import jwt from "jsonwebtoken";
import * as crypto from "crypto";

// Chave secreta para assinar JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString("hex");
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString("hex");

// Duração dos tokens
const ACCESS_TOKEN_EXPIRES_IN = "15m"; // 15 minutos
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // 7 dias

export interface JWTPayload {
  userId: number;
  email: string;
  role: "admin" | "agent";
  type: "access" | "refresh";
}

export function generateAccessToken(userId: number, email: string, role: "admin" | "agent"): string {
  const payload: JWTPayload = {
    userId,
    email,
    role,
    type: "access",
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function generateRefreshToken(userId: number, email: string, role: "admin" | "agent"): string {
  const payload: JWTPayload = {
    userId,
    email,
    role,
    type: "refresh",
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type !== "access") {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
    if (decoded.type !== "refresh") {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getTokenExpirationDate(expiresIn: string): Date {
  const now = new Date();
  
  // Parse expiresIn (e.g., "15m", "7d", "1h")
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      now.setSeconds(now.getSeconds() + value);
      break;
    case "m":
      now.setMinutes(now.getMinutes() + value);
      break;
    case "h":
      now.setHours(now.getHours() + value);
      break;
    case "d":
      now.setDate(now.getDate() + value);
      break;
  }

  return now;
}

export const ACCESS_TOKEN_EXPIRATION = getTokenExpirationDate(ACCESS_TOKEN_EXPIRES_IN);
export const REFRESH_TOKEN_EXPIRATION = getTokenExpirationDate(REFRESH_TOKEN_EXPIRES_IN);
