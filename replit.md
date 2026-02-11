# Michels Travel - Flight Booking Platform

## Overview

Michels Travel ("Opção Eficiente") is a full-stack flight booking platform that allows users to search for flights, book them with Stripe payments, and manage bookings. It's a commission-based travel agency app targeting Brazilian/Portuguese-speaking customers, with multi-language support (Portuguese, English, Spanish). The app integrates with the Duffel API for real-time flight search and pricing, uses Stripe for payment processing, and includes an admin dashboard for monitoring revenue and bookings. Includes a test mode toggle system for production safety.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React SPA)
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data Fetching**: TanStack React Query for server state management with a custom `apiRequest` helper and `queryClient` configuration
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives, styled with Tailwind CSS and CSS variables for theming
- **Animations**: Framer Motion for page transitions and UI interactions
- **Charts**: Recharts for admin dashboard analytics
- **Internationalization**: Custom i18n system with React Context (`I18nProvider`) supporting pt/en/es, stored in localStorage with a language selection modal on first visit
- **Design**: Dark immersive theme inspired by Venmo (clean bold typography, card-based sections, vibrant accents) and Universal Orlando (cinematic hero, dark overlays, full-bleed imagery). Deep navy background with amber/orange primary, cyan/teal accent. Fonts are Outfit (display) and DM Sans (body). Uses CSS shimmer animations, gradient borders, and section alternation (section-dark/section-elevated classes)
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend (Express + Node.js)
- **Framework**: Express.js running on Node with TypeScript (via tsx in dev, esbuild for production)
- **API Pattern**: RESTful JSON API under `/api/` prefix. Routes defined in `server/routes.ts` with typed schemas in `shared/routes.ts`
- **Authentication**: Replit Auth via OpenID Connect (OIDC) with Passport.js, session-based auth stored in PostgreSQL via `connect-pg-simple`. Auth integration lives in `server/replit_integrations/auth/`
- **Database**: PostgreSQL with Drizzle ORM. Schema defined in `shared/schema.ts` and `shared/models/auth.ts`. Use `npm run db:push` (drizzle-kit push) for schema migrations
- **Session Management**: Express sessions with PostgreSQL session store, 1-week TTL

### Shared Layer (`shared/`)
- `schema.ts` — Drizzle table definitions (flight_searches, bookings, site_settings, blog_posts) plus re-exports auth models
- `models/auth.ts` — Users and sessions tables (required for Replit Auth, do not drop)
- `routes.ts` — API route contracts with Zod schemas for input validation and response parsing, used by both client hooks and server handlers

### Key Data Models
- **users** — Auth users with optional Stripe customer/subscription IDs and admin flag
- **sessions** — PostgreSQL-backed session storage for Replit Auth
- **flight_searches** — Search history/cache for SEO and popular destinations
- **bookings** — Flight booking records with commission tracking, Stripe payment status, passenger details as JSONB
- **site_settings** — Admin-configurable site name, commission percentage, hero text
- **blog_posts** — CMS-style blog content with slugs, cover images, excerpts

### Storage Pattern
- `server/storage.ts` exports a `DatabaseStorage` class implementing `IStorage` interface
- Auth operations are delegated to `authStorage` from the Replit Auth integration
- Stripe product/price data is read from synced tables (via `stripe-replit-sync`)

### Build System
- **Dev**: `tsx server/index.ts` with Vite dev server middleware for HMR
- **Production**: Client built with Vite to `dist/public/`, server bundled with esbuild to `dist/index.cjs`. Specific dependencies are bundled (allowlisted) to reduce cold start times
- **Static serving**: In production, Express serves the Vite build output and falls back to `index.html` for SPA routing

## External Dependencies

### Duffel API (Flight Search)
- Provides real-time flight search, offer requests, and place/airport autocomplete
- Requires `DUFFEL_API_TOKEN` environment variable
- Integration in `server/services/duffel.ts`
- Falls back gracefully (empty results) if token is missing

### Stripe (Payments)
- Handles one-time flight booking payments and subscription checkout sessions
- Uses Replit's Stripe connector for credentials (`server/stripeClient.ts`) — fetches keys dynamically based on deployment environment (dev vs production)
- `stripe-replit-sync` manages webhook registration and syncs product/price data to PostgreSQL
- Webhook endpoint must be registered before `express.json()` middleware to receive raw Buffer payloads
- Key files: `server/stripeClient.ts`, `server/stripeService.ts`, `server/webhookHandlers.ts`

### PostgreSQL Database
- Required via `DATABASE_URL` environment variable
- Used for all data storage: users, sessions, bookings, flight searches, site settings, blog posts, and Stripe sync tables
- Managed with Drizzle ORM (`drizzle-orm/node-postgres`) and `pg` Pool

### Replit Auth (OpenID Connect)
- Authentication via Replit's OIDC provider
- Requires `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET` environment variables
- Sessions stored in PostgreSQL `sessions` table
- Integration files in `server/replit_integrations/auth/`

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `DUFFEL_API_TOKEN` — Duffel flight API key
- `SESSION_SECRET` — Express session secret
- `REPL_ID` — Replit environment identifier (auto-set by Replit)
- Stripe credentials are fetched dynamically via Replit connectors (not env vars)