import type { Express } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import { authStorage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { db } from "../../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

export function registerAuthRoutes(app: Express): void {
  // ── GET current user ───────────────────────────────────────
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const user = await authStorage.getUser(req.user.id);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ── POST /api/auth/register ────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email e senha são obrigatórios." });
      }

      const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()));

      if (existing) {
        return res.status(409).json({ message: "Este email já está cadastrado." });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await db
        .insert(users)
        .values({
          email: email.toLowerCase(),
          firstName: firstName || null,
          lastName: lastName || null,
          passwordHash,
        } as any)
        .returning();

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Erro ao fazer login." });
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Erro ao criar conta." });
    }
  });

  // ── POST /api/login ────────────────────────────────────────
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Credenciais inválidas." });
      }
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        return res.json(user);
      });
    })(req, res, next);
  });

  // ── GET /api/login (redirect for legacy compatibility) ─────
  app.get("/api/login", (req, res) => {
    res.redirect("/?login=true");
  });

  // ── GET /api/logout ────────────────────────────────────────
  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  // ── POST /api/logout ───────────────────────────────────────
  app.post("/api/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  // ── GET /api/callback (legacy Replit callback — redirect) ──
  app.get("/api/callback", (req, res) => {
    res.redirect("/");
  });

  // ── Health check ───────────────────────────────────────────
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
}
