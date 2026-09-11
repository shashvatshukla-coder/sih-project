# ==============================================================================
# Bhu-Drishti Production Dockerfile
# Multi-stage build for React Frontend + Express Backend + Prisma / PostgreSQL
# ==============================================================================

# Stage 1: Build the Application
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source files
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Frontend & Compile TypeScript
RUN npm run build

# Stage 2: Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# Copy package manifests and production dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev && npx prisma generate

# Copy built server and frontend static assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Expose backend & client port
EXPOSE 3001

# Start the full-stack server
CMD ["npm", "run", "start:server"]
