# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-slim AS builder

# Install build essentials for native modules (Needed for bcrypt, pg, etc.)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set memory limit globally for Node during the build phase (Stops OOM crashes)
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install ALL dependencies (including tsx, vite, esbuild)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code (Protected by .dockerignore to avoid OS mismatch)
COPY . .

# Build the project (frontend + backend)
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────
FROM node:20-slim AS production

WORKDIR /app

# Install production dependencies only (including vite as it's now in dependencies)
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev

# Copy built artifacts and migrations from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Expose the default application port
EXPOSE 5000

# Start the server (using cross-env which is also in dependencies)
CMD ["npm", "run", "start"]
