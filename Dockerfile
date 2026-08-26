# Multi-stage Dockerfile for Sentrix SRE Control Plane
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency specifications
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build Vite frontend and bundle Express backend to dist/server.cjs
RUN npm run build

# --- Production Runtime Image ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built frontend assets and compiled backend bundle
COPY --from=builder /app/dist ./dist

# Expose container port
EXPOSE 3000

# Start production server
CMD ["node", "dist/server.cjs"]
