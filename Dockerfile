# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-bookworm AS builder

# Install build essentials for native modules (Debian compatibility)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set memory limit and production flag during build
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production

# Install ALL dependencies
COPY package*.json ./
# Note: We keep package-lock.json if it exists to ensure build reproducibility
RUN npm install --legacy-peer-deps

# Copy source code (Protected by .dockerignore)
COPY . .

# Build the project (frontend + backend) with verbose failure tracking
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────
FROM node:20-bookworm-slim AS production

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

# Copy built artifacts and migrations from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Expose the default application port
EXPOSE 5000

# Start the server
CMD ["npm", "run", "start"]
