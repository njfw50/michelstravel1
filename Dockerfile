# ── Stage 1: Build ──────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install ALL dependencies (including dev for build)
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build the project (frontend + backend)
# dist/public = client build (served as static files)
# dist/index.mjs = server bundle
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies + vite (needed at runtime for server/vite.ts import)
COPY package*.json ./
RUN npm install --legacy-peer-deps --omit=dev && \
    npm install --legacy-peer-deps vite @vitejs/plugin-react

# Copy built artifacts from builder stage
# dist/ contains index.mjs (server) and public/ (client assets)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Expose the default application port
EXPOSE 5000

# Start the server
CMD ["npm", "run", "start"]
