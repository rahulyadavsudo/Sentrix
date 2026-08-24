# ---- Stage 1: Build Frontend and Bundle Server ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source code and build production bundle
COPY . .
RUN npm run build

# ---- Stage 2: Production Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy compiled artifacts from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
