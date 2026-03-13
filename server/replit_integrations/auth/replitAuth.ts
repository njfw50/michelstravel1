/**
 * auth.ts — JWT-based authentication (Railway-compatible)
 * Replaces the Replit OIDC integration with a standard
 * email/password + JWT session system.
 */
import passport from "passport";
import { Strategy as GitHubStrategy, type Profile as GitHubProfile } from "passport-github2";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPg from "connect-pg-simple";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import { authStorage } from "./storage";
import { db } from "../../db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";

interface GitHubEmail {
  value?: string;
  verified?: boolean;
  primary?: boolean;
}

function isGitHubEmail(value: unknown): value is GitHubEmail {
  return typeof value === "object" && value !== null;
}

function getVerifiedGitHubEmail(profile: GitHubProfile): string | null {
  const emails = Array.isArray(profile.emails)
    ? (profile.emails as GitHubEmail[]).filter(isGitHubEmail)
    : [];

  const primaryVerified = emails.find((email) => email.primary && email.verified && email.value);
  if (primaryVerified?.value) {
    return primaryVerified.value.toLowerCase();
  }

  const fallbackVerified = emails.find((email) => email.verified && email.value);
  if (fallbackVerified?.value) {
    return fallbackVerified.value.toLowerCase();
  }

  return null;
}

function splitGitHubName(profile: GitHubProfile): { firstName: string | null; lastName: string | null } {
  const rawName = profile.displayName?.trim() || profile.username?.trim() || "";
  if (!rawName) {
    return { firstName: null, lastName: null };
  }

  const parts = rawName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: null };
  }

  return {
    firstName: parts[0] || null,
    lastName: parts.slice(1).join(" ") || null,
  };
}

function getGitHubProfileImage(profile: GitHubProfile): string | null {
  const photo = Array.isArray(profile.photos) ? profile.photos[0]?.value : null;
  return photo || null;
}

export function isGitHubAuthConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_CLIENT_ID &&
      process.env.GITHUB_CLIENT_SECRET &&
      process.env.GITHUB_CALLBACK_URL
  );
}

// ── Session setup ────────────────────────────────────────────
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const isProduction = process.env.NODE_ENV === "production";

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
      maxAge: sessionTtl,
    },
  });
}

// ── Passport local strategy ──────────────────────────────────
passport.use(
  new LocalStrategy(
    { usernameField: "email", passwordField: "password" },
    async (email, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()));

        if (!user) {
          return done(null, false, { message: "Email ou senha incorretos." });
        }

        const passwordHash = (user as any).passwordHash;
        if (!passwordHash) {
          return done(null, false, { message: "Conta sem senha configurada." });
        }

        const valid = await bcrypt.compare(password, passwordHash);
        if (!valid) {
          return done(null, false, { message: "Email ou senha incorretos." });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

if (isGitHubAuthConfigured()) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: process.env.GITHUB_CALLBACK_URL!,
        scope: ["user:email"],
        userAgent: "www.michelstravel.agency",
        allRawEmails: true,
      },
      async (
        _accessToken: string,
        _refreshToken: string,
        profile: GitHubProfile,
        done: (err: Error | null, user?: unknown, info?: { message?: string }) => void
      ) => {
        try {
          const githubId = profile.id;
          const githubUsername = profile.username || null;
          const email = getVerifiedGitHubEmail(profile);

          if (!email) {
            return done(null, false, { message: "github_email_required" });
          }

          const { firstName, lastName } = splitGitHubName(profile);
          const profileImageUrl = getGitHubProfileImage(profile);

          const [existingByGitHubId] = await db
            .select()
            .from(users)
            .where(eq(users.githubId, githubId));

          if (existingByGitHubId) {
            const [updatedByGitHubId] = await db
              .update(users)
              .set({
                email: existingByGitHubId.email || email,
                githubUsername,
                profileImageUrl: existingByGitHubId.profileImageUrl || profileImageUrl,
                firstName: existingByGitHubId.firstName || firstName,
                lastName: existingByGitHubId.lastName || lastName,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingByGitHubId.id))
              .returning();

            return done(null, updatedByGitHubId);
          }

          const [existingByEmail] = await db
            .select()
            .from(users)
            .where(eq(users.email, email));

          if (existingByEmail) {
            const [linkedUser] = await db
              .update(users)
              .set({
                githubId,
                githubUsername,
                profileImageUrl: existingByEmail.profileImageUrl || profileImageUrl,
                firstName: existingByEmail.firstName || firstName,
                lastName: existingByEmail.lastName || lastName,
                updatedAt: new Date(),
              })
              .where(eq(users.id, existingByEmail.id))
              .returning();

            return done(null, linkedUser);
          }

          const [newUser] = await db
            .insert(users)
            .values({
              email,
              firstName,
              lastName,
              profileImageUrl,
              githubId,
              githubUsername,
            } as typeof users.$inferInsert)
            .returning();

          return done(null, newUser);
        } catch (err) {
          return done(err as Error);
        }
      }
    )
  );
}

passport.serializeUser((user: any, cb) => cb(null, user.id));
passport.deserializeUser(async (id: string, cb) => {
  try {
    const user = await authStorage.getUser(id);
    cb(null, user ?? null);
  } catch (err) {
    cb(err);
  }
});

// ── Paths that skip session middleware ───────────────────────
const STATELESS_PATHS = [
  "/api/bookings",
  "/api/stripe-key",
  "/api/stripe/webhook",
  "/api/flights",
  "/api/places",
  "/api/chatbot",
  "/api/blog",
  "/api/settings",
  "/api/test-mode",
  "/api/flight-board",
  "/api/airlines",
  "/api/airports",
  "/api/aircraft",
  "/api/admin-app",
  "/api/admin/chatbot",
  "/api/live-sessions",
  "/sitemap.xml",
  "/robots.txt",
];

function isStatelessPath(path: string): boolean {
  if (path.startsWith("/api/live-sessions/admin")) return false;
  if (path.startsWith("/api/admin/")) return false;
  return STATELESS_PATHS.some(
    (sp) =>
      path === sp ||
      path.startsWith(sp + "/") ||
      path.startsWith(sp + "?")
  );
}

// ── setupAuth ────────────────────────────────────────────────
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  const sessionMiddleware = getSession();
  const passportInit = passport.initialize();
  const passportSession = passport.session();

  app.use((req, res, next) => {
    if (isStatelessPath(req.path)) return next();
    sessionMiddleware(req, res, next);
  });
  app.use((req, res, next) => {
    if (isStatelessPath(req.path)) return next();
    passportInit(req, res, next);
  });
  app.use((req, res, next) => {
    if (isStatelessPath(req.path)) return next();
    passportSession(req, res, next);
  });
}

// ── isAuthenticated middleware ───────────────────────────────
export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ message: "Unauthorized" });
};
