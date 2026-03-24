# Michels Travel - Flight Commission Hub

**Michels Travel** is a full-featured SaaS platform for flight search, booking, and commission management — designed for travel agents at [www.michelstravel.agency](https://www.michelstravel.agency). It includes an AI-powered chatbot, live agent chat, admin dashboard, payment processing, phone/voice support, document scanning, and native mobile apps.

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Technologies](#-key-technologies)
3. [Repository Structure](#-repository-structure)
4. [Code Organization](#-code-organization)
   - [Frontend (`client/`)](#frontend-client)
   - [Backend (`server/`)](#backend-server)
   - [Shared Code (`shared/`)](#shared-code-shared)
   - [Mobile Apps (`mobile/`, `mobile-app/`)](#mobile-apps-mobile-mobile-app)
   - [Database Migrations (`migrations/`)](#database-migrations-migrations)
5. [Database Schema](#-database-schema)
6. [API Endpoints](#-api-endpoints)
7. [Getting Started](#-getting-started)
8. [Available Scripts](#-available-scripts)
9. [Deployment](#-deployment)
10. [Security](#-security)

---

## 🎯 Project Overview

Michels Travel is built around the following core capabilities:

| Feature | Description |
|---|---|
| **Flight Search & Booking** | Real-time flight search and booking via the [Duffel API](https://duffel.com/) |
| **Commission Tracking** | Automatic calculation and reporting of travel agent commissions on each booking |
| **AI Chatbot** | OpenAI-powered conversational assistant for customer support |
| **Live Agent Chat** | Real-time agent-to-customer sessions with screen sharing (flight offers, documents) |
| **Admin Dashboard** | Owner/agent back-office for bookings, stats, settings, and promotions |
| **Payment Processing** | Stripe integration supporting both test and live modes |
| **Document Scanning** | OCR and AI vision to extract data from passports, visas, and ID documents |
| **Voice & Phone** | Twilio-powered phone escalation and voice assistant for senior customers |
| **Push Notifications** | Web push notifications for agents and mobile apps |
| **Mobile Apps** | React Native / Expo apps for iOS and Android |
| **Internationalization** | Multi-language UI with locale files |

---

## 🚀 Key Technologies

### Frontend
| Technology | Role |
|---|---|
| **React 18 + TypeScript** | UI framework |
| **Vite 7** | Development server and production bundler |
| **TailwindCSS 3 + shadcn/ui** | Styling system built on Radix UI primitives |
| **TanStack Query (React Query) 5** | Server state management and caching |
| **Wouter 3** | Lightweight client-side routing |
| **React Hook Form + Zod** | Form state management and schema validation |
| **Framer Motion** | Animations and transitions |
| **Recharts** | Analytics charts in the admin dashboard |
| **date-fns** | Date formatting and manipulation |
| **Lucide React + react-icons** | Icon libraries |

### Backend
| Technology | Role |
|---|---|
| **Node.js 20 + Express 5** | HTTP server runtime |
| **TypeScript 5.6** | Language across the entire codebase |
| **PostgreSQL 16** | Primary database (also compatible with TiDB) |
| **Drizzle ORM 0.39** | Type-safe SQL query builder and schema definition |
| **Passport.js** | Authentication (GitHub OAuth + local email/password) |
| **express-session + connect-pg-simple** | Session management backed by PostgreSQL |
| **Stripe SDK 20** | Payment processing and webhook handling |
| **Duffel API SDK 4** | Flight search, offers, and booking |
| **OpenAI API SDK 6** | Chat, image vision, and audio processing |
| **Twilio SDK 5** | Voice calls, SMS, and phone escalation |
| **Nodemailer 8** | Transactional email (confirmations, notifications) |
| **ws (WebSocket) 8** | Real-time communication for live sessions |
| **web-push 3** | Push notifications for browsers and mobile |
| **Tesseract.js 7** | OCR engine for document scanning |
| **Helmet 8** | HTTP security headers |
| **express-rate-limit 8** | Rate limiting for API protection |
| **Zod + drizzle-zod** | Runtime validation and schema inference |

### Infrastructure
| Technology | Role |
|---|---|
| **Docker (Node 20 Alpine)** | Containerization |
| **Render** | PaaS deployment platform |
| **GitHub Actions** | CI/CD with Node 18/20/22 build matrix |
| **Datadog Synthetics** | Uptime and synthetic monitoring |

### Mobile
| Technology | Role |
|---|---|
| **React Native + Expo 55** | Cross-platform mobile app framework |
| **EAS (Expo Application Services)** | Cloud build and app distribution |

---

## 🏗️ Repository Structure

```
michelstravel1/
├── client/                          # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/              # ~72 reusable React components
│   │   ├── pages/                   # ~25 page-level components
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utilities, API client wrappers, i18n
│   │   ├── assets/                  # Images, icons
│   │   ├── locales/                 # i18n translation files
│   │   └── App.tsx                  # Root component and route definitions
│   └── index.html                   # HTML entry point
├── server/                          # Node.js/Express backend
│   ├── index.ts                     # Server entry point and Express setup
│   ├── routes.ts                    # All 100+ API route handlers
│   ├── routes/                      # Specialized route modules
│   │   ├── voice_escalation.ts      # Phone/voice call handling
│   │   ├── customer_mobile.ts       # API endpoints for mobile apps
│   │   └── owner_push.ts            # Push notification endpoints
│   ├── services/                    # Business logic layer
│   │   ├── duffel.ts                # Flight search via Duffel API
│   │   ├── stripeService.ts         # Payment and commission logic
│   │   ├── chatbotAi.ts             # AI chatbot via OpenAI
│   │   ├── emailService.ts          # Email sending
│   │   ├── documentScannerAi.ts     # Passport/ID OCR + AI analysis
│   │   ├── ownerDesk.ts             # Admin dashboard logic
│   │   └── passengerPrivacy.ts      # PII redaction utilities
│   ├── replit_integrations/         # OAuth session helpers
│   │   └── auth.ts                  # GitHub OAuth + local auth setup
│   ├── voice_assistant/             # Voice/phone integration
│   │   └── voice_server.ts          # Twilio voice server
│   ├── db.ts                        # PostgreSQL connection (Drizzle)
│   ├── storage.ts                   # Data access layer (CRUD operations)
│   ├── storage_escalations.ts       # Escalation-specific data access
│   ├── webhookHandlers.ts           # Stripe webhook event processors
│   ├── duffelWebhookHandlers.ts     # Duffel booking update webhooks
│   ├── stripeClient.ts              # Stripe SDK initialization
│   ├── appMigrations.ts             # Applies SQL migrations at startup
│   ├── blogSeed.ts                  # Seed data for blog posts
│   ├── static.ts                    # Static file serving in production
│   └── vite.ts                      # Vite dev server proxy integration
├── shared/                          # Code shared between frontend & backend
│   ├── schema.ts                    # Drizzle database schema (all tables)
│   ├── routes.ts                    # API type definitions (request/response)
│   └── models/
│       ├── auth.ts                  # User and authentication types
│       └── chat.ts                  # Chatbot session and message types
├── mobile/                          # React Native mobile backend APIs
│   ├── server/                      # Mobile-specific Express routes
│   └── README_MOBILE.md             # Mobile setup documentation
├── mobile-app/                      # EAS/Expo build configuration
│   ├── screens/                     # Native mobile screen components
│   └── eas.json                     # Expo build profiles
├── migrations/                      # SQL migration files run at startup
│   ├── add_featured_deals.sql
│   ├── add_github_auth_columns.sql
│   ├── add_live_session_profiles.sql
│   ├── add_mobile_consumer_platform.sql
│   ├── add_owner_push_notifications.sql
│   ├── add_voice_escalations.sql
│   └── ...
├── script/                          # Deployment and build automation
│   ├── build.ts                     # Custom production build script
│   ├── ship-site.ps1                # Windows deploy to Render
│   └── render-deploy.ps1            # Render deployment automation
├── .github/workflows/               # GitHub Actions CI/CD
│   ├── webpack.yml                  # Multi-node build/test pipeline
│   ├── datadog-synthetics.yml       # Synthetic monitoring checks
│   └── generator-generic-ossf-slsa3-publish.yml  # SLSA3 provenance
├── Dockerfile                       # Multi-stage Docker image
├── render.yaml                      # Render deployment configuration
├── package.json                     # Root npm dependencies and scripts
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite bundler configuration
├── drizzle.config.ts                # Drizzle ORM configuration
├── tailwind.config.ts               # TailwindCSS configuration
├── components.json                  # shadcn/ui component configuration
├── .env.example                     # Environment variable template
└── .env.render                      # Production environment checklist
```

---

## 🧩 Code Organization

### Frontend (`client/`)

The frontend is a single-page React application built with Vite. All source code lives under `client/src/`:

- **`components/`** — Reusable UI building blocks. Includes both generic UI primitives (buttons, dialogs, modals) and feature-specific components (flight cards, booking forms, admin panels, chat widgets).
- **`pages/`** — Top-level page components that correspond to routes (e.g., `Home`, `SearchResults`, `BookingConfirmation`, `AdminDashboard`). Each page composes components and hooks.
- **`hooks/`** — Custom React hooks that encapsulate business logic, data fetching (via React Query), and side effects.
- **`lib/`** — Utility functions, API client wrappers (`fetch`-based), i18n helpers, and constants.
- **`locales/`** — Translation files for internationalization.
- **`App.tsx`** — Root component that sets up the router (Wouter), query client (React Query), and global providers (themes, authentication context).

### Backend (`server/`)

The backend is a Node.js/Express server with a layered architecture:

1. **Entry point** (`index.ts`) — Bootstraps Express, registers middleware (Helmet, CORS, session, rate limiting), mounts all routes, and starts the HTTP/WebSocket server.
2. **Routes** (`routes.ts` + `routes/`) — Defines all API endpoints. Each route handler is thin: it validates input, calls a service or storage function, and returns a response.
3. **Services** (`services/`) — Business logic that is independent of HTTP. Each service encapsulates calls to external APIs (Duffel, Stripe, OpenAI, Twilio) or complex processing (document OCR, commission calculation).
4. **Storage** (`storage.ts`, `storage_escalations.ts`) — Data access layer that wraps Drizzle ORM queries. All database reads/writes go through these functions, keeping routes and services decoupled from raw SQL.
5. **Webhooks** (`webhookHandlers.ts`, `duffelWebhookHandlers.ts`) — Handlers for incoming webhook events from Stripe (payments) and Duffel (booking updates).
6. **Auth** (`replit_integrations/auth.ts`) — Configures Passport.js strategies (GitHub OAuth and local), session serialization, and login/logout endpoints.
7. **Voice** (`voice_assistant/voice_server.ts`) — Twilio-powered phone IVR and voice assistant for senior customer support.

### Shared Code (`shared/`)

The `shared/` directory contains code that is imported by both the frontend and backend:

- **`schema.ts`** — Drizzle ORM table definitions. This is the single source of truth for the database schema.
- **`routes.ts`** — TypeScript types for API request and response payloads, ensuring type safety end-to-end.
- **`models/`** — Domain model types for users, auth sessions, and chatbot conversations.

### Mobile Apps (`mobile/`, `mobile-app/`)

- **`mobile/`** — Contains mobile-specific Express API routes (customer portal endpoints) and setup documentation.
- **`mobile-app/`** — React Native screen components and EAS build configuration (`eas.json`) for compiling iOS and Android apps via Expo Application Services.

### Database Migrations (`migrations/`)

Plain SQL files in `migrations/` are automatically applied by `server/appMigrations.ts` at server startup. Each file adds a specific feature's tables or columns, making incremental schema evolution traceable.

---

## 🗄️ Database Schema

All tables are defined in [`shared/schema.ts`](./shared/schema.ts) using Drizzle ORM.

| Table | Purpose |
|---|---|
| **users** | User accounts with hashed passwords and GitHub OAuth identifiers |
| **sessions** | PostgreSQL-backed express sessions |
| **conversations** | AI chatbot conversation threads |
| **messages** | Individual messages within chatbot conversations |
| **flightSearches** | Logged flight searches for analytics and SEO |
| **bookings** | Flight bookings with commission data and Stripe payment references |
| **siteSettings** | Admin-controlled configuration (commission %, test/live mode) |
| **blogPosts** | SEO blog content with multilingual support |
| **liveSessions** | Real-time agent-to-customer live sessions |
| **liveSessionBlocks** | Visual content blocks (flight offers, docs) shared in live sessions |
| **liveSessionMessages** | Messages exchanged within a live session |
| **internalThreads** | Customer support ticket threads |
| **internalMessages** | Messages within support threads |
| **voiceEscalations** | Records of phone/voice escalation events |
| **seniorAlerts** | Special support alerts for elderly customers |
| **featuredDeals** | Promotional flight deals used for social media campaigns |

---

## 🔌 API Endpoints

All routes are defined in [`server/routes.ts`](./server/routes.ts). Key groups:

### Flights
```
GET  /api/places/search              # Autocomplete airports/cities
GET  /api/flights/search             # Search flights (Duffel)
GET  /api/flights/popular            # Popular routes
GET  /api/flights/:id/refresh        # Refresh offer pricing
GET  /api/flights/:offerId/seat-map  # Seat map
GET  /api/flights/:offerId/services  # Ancillary services (bags, seats)
```

### Bookings
```
POST /api/bookings                   # Create booking
GET  /api/bookings/:id               # Booking details
GET  /api/bookings/lookup            # Find by reference code
POST /api/bookings/:id/cancel        # Cancel booking
POST /api/bookings/:id/change-request  # Request flight change
GET  /api/bookings/:id/refund-quote  # Refund eligibility
POST /api/bookings/:id/send-confirmation  # Email confirmation
```

### Chatbot / Live Sessions
```
POST /api/chatbot/session            # Start AI chat session
POST /api/chatbot/message            # Send message to AI
POST /api/chatbot/escalate           # Escalate to human agent
POST /api/live-sessions/request      # Customer requests live session
GET  /api/live-sessions/:id/stream   # SSE stream for real-time messages
```

### Admin
```
POST /api/admin/login                # Admin login
GET  /api/admin/bookings             # All bookings (paginated)
GET  /api/admin/stats                # Dashboard metrics
GET  /api/admin/settings             # App configuration
POST /api/admin/settings             # Update configuration
GET  /api/admin/featured-deals       # Promotional deals management
```

### Document Scanner
```
POST /api/document-scanner/analyze   # OCR + AI analysis of passport/ID
```

---

## ⚙️ Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **PostgreSQL** 16 (or TiDB)
- **Stripe** account (API keys)
- **OpenAI** account (optional, for AI features)
- **Duffel** account (for flight search)

### Setup

**1. Install dependencies**
```bash
npm install
```

**2. Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe (Test)
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...

# Stripe (Live)
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...

# Duffel (Flight Search)
DUFFEL_LIVE_TOKEN=duffel_live_...

# OpenAI
AI_INTEGRATIONS_OPENAI_API_KEY=sk-...
AI_INTEGRATIONS_OPENAI_BASE_URL=https://api.openai.com/v1

# Auth & Session
SESSION_SECRET=<random 32+ character string>
ADMIN_PASSWORD=<secure admin password>

# GitHub OAuth (optional)
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

PORT=5000
```

**3. Initialize the database**
```bash
npm run db:push
```

**4. Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

---

## 📦 Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server (Vite + Express with hot reload) |
| `npm run build` | Build frontend and compile backend for production |
| `npm run start` | Start the production server |
| `npm run db:push` | Apply Drizzle schema to the database |

---

## 🌐 Deployment

### Render (recommended)

The repository includes [`render.yaml`](./render.yaml) for one-click deployment on [Render](https://render.com):

- **Build command:** `npm install --legacy-peer-deps && npm run build`
- **Start command:** `npm run start`
- **Health check:** `/api/health`
- **Domain:** `www.michelstravel.agency`

**Required environment variables on Render:**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random secret for session encryption |
| `ADMIN_PASSWORD` | Password for admin dashboard |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth app credentials |
| `STRIPE_LIVE_SECRET_KEY` / `STRIPE_LIVE_PUBLISHABLE_KEY` | Stripe live keys |
| `DUFFEL_LIVE_TOKEN` | Duffel API token |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | OpenAI API key |

See [`.env.render`](./.env.render) for the full production checklist.

**Custom domain setup:**
1. Set `APP_URL=https://www.michelstravel.agency` and `GITHUB_CALLBACK_URL=https://www.michelstravel.agency/api/auth/github/callback`
2. Connect `www.michelstravel.agency` in **Render > Settings > Custom Domains**
3. Create DNS records at your domain registrar as instructed by Render

### Notes
- SQL files in `migrations/` are applied automatically at server startup by `server/appMigrations.ts`.
- Render provides `PORT` automatically in production — do not set it manually.

---

## 🔐 Security

> ⚠️ **Never commit `.env` to Git.** It contains sensitive credentials.

**Generate a secure `SESSION_SECRET`:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Security features built into the application:
- `Helmet` middleware sets secure HTTP response headers
- `express-rate-limit` protects API endpoints from abuse
- PII redaction via `server/services/passengerPrivacy.ts`
- Stripe webhook signature verification
- Session data stored securely in PostgreSQL (not in cookies)
- bcryptjs password hashing

---

## 📄 License

This project is private and proprietary.

## 🤝 Support

For support, open an issue in this repository or contact the team via email.
