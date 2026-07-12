# 🏛️ Michels Travel
### Senior Travel Intelligence & Booking Governance Platform

A high-performance booking and commission management system for elite travel agencies, built with React, TypeScript, Node.js, and Stripe integration. Governed by the **Canonical Engineering Protocol**.

---

## 🚀 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS 3.4
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (TiDB Compatible)
- **ORM**: Drizzle ORM
- **Payments**: Stripe (Live & Test Modes)
- **AI Engine**: OpenAI API (Support for Chat, Image Generation, and MRZ OCR Analysis)
- **Security**: GitHub OAuth + Session-based Authentication via PostgreSQL

---

## 📋 Prerequisites

- **Node.js**: 20.x or higher
- **Database**: PostgreSQL 16 or TiDB
- **Stripe**: Account with API keys
- **OpenAI**: Account (Optional, for AI components like "Mia")

---

## 🔧 Local Configuration

### 1. Clone the Repository
```bash
git clone <repository-url>
cd michels-travel
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Environment Variables
Copy the `.env.example` template to a new `.env` file:
```bash
cp .env.example .env
```
Fill in your credentials in the `.env` file following the template instructions.

### 4. Database Initialization
Run Drizzle migrations to set up the schema:
```bash
npm run db:push
```

### 5. Launch Development Environment
```bash
npm run dev
```
The application will be available at `http://localhost:5000`

---

## 🔐 Security & Governance

⚠️ **IMPORTANT**: Never commit the `.env` file to version control. It contains sensitive credentials.

### Secure Session Generation
Generate a robust `SESSION_SECRET` using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Project Governance (The Book of Life)
This project follows the **Canonical Engineering Protocol**. All architectural changes, infrastructure decisions, and critical events are recorded in [BOOK_OF_LIFE.md](./BOOK_OF_LIFE.md). Developers must adhere to the **Deployment Civil Code** for production-ready code.

---

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Compile project for production (Vite + Esbuild)
- `npm run start` - Run production server
- `npm run db:push` - Synchronize database schema

---

## 🏗️ Project Architecture

```
michels-travel/
├── client/              # React Frontend Entry
│   ├── src/
│   │   ├── components/  # Atomic UI Components
│   │   ├── pages/       # Route-level Components
│   │   └── lib/         # Shared Logic (i18n, utils)
├── server/              # Node.js Backend Entry
│   ├── db.ts           # DB Driver Configuration
│   ├── routes.ts       # API Route Definitions
│   ├── storage.ts      # Data Access Layer (DAL)
│   ├── stripeClient.ts # Stripe SDK Wrapper
│   └── replit_integrations/ # Platform Helpers
├── shared/             # Cross-platform Logic (Schemas, Types)
├── BOOK_OF_LIFE.md     # Governance & Laws
└── DEPLOY_AUTOMATION.md # CI/CD Documentation
```

---

## 🌐 Production Deployment (Render)

The repository includes a [`render.yaml`](./render.yaml) specification file for automated builds:

- **Build Command**: `npm install --legacy-peer-deps && npm run build`
- **Start Command**: `npm run start`
- **Health Check**: `/api/health`
- **Primary Domain**: `www.michelstravel.agency`

### Required Environment Variables
Ensure the following are configured in your Render Web Service:
`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD`, `STRIPE_LIVE_SECRET_KEY`, `DUFFEL_LIVE_TOKEN`, `AI_INTEGRATIONS_OPENAI_API_KEY`.

---

## 📄 Licensing
This project is private and proprietary. All rights reserved.

## 🤝 Support
For technical support or inquiries, please contact the engineering team via repository issues or direct email.
