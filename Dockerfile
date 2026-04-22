# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-slim AS builder

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set memory limit and production flag during build
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NODE_ENV=production
ENV CI=true

# Hardened dependency installation
COPY package*.json ./
# Clean install with dev dependencies for build
RUN npm install --include=dev --prefer-offline --no-audit --legacy-peer-deps

# Copy source code (Protected by .dockerignore)
COPY . .

# Build the project (frontend + backend) with memory-efficient settings
ENV CI=true
# RUN npm run build (Bypassed! Using pre-built dist folder via Git)

# ── Stage 2: Production ──────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app
ENV NODE_ENV=production
ENV CI=true
ENV NODE_OPTIONS="--max-old-space-size=1536"

# Hardened dependency installation for production
COPY package*.json ./
RUN npm install --omit=dev --prefer-offline --no-audit --legacy-peer-deps && npm cache clean --force

# Copy built artifacts and migrations from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Expose the default application port
EXPOSE 5000

# Start the server
CMD ["npm", "run", "start"]
