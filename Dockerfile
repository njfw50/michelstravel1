# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20 AS builder

# Install build essentials for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Set memory limit globally for Node during the build phase
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Install ALL dependencies
COPY package*.json ./
# Force fresh resolution for Linux to avoid Windows binary locks
RUN rm -f package-lock.json
RUN npm install --legacy-peer-deps

# Copy source code (Protected by .dockerignore)
COPY . .

# Build the project (frontend + backend)
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────
FROM node:20 AS production

WORKDIR /app

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
