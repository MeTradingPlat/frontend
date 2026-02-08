# Stage 1: Build
FROM node:20-alpine AS builder

# Build argument para el token SSE
ARG SSE_AUTH_TOKEN=CHANGE_THIS_IN_PRODUCTION

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production=false

# Copy source code
COPY . .

# Reemplazar el token en environment.prod.ts usando Node.js (maneja mejor caracteres especiales)
RUN node -e "const fs=require('fs');const f='src/environments/environment.prod.ts';const t=process.env.SSE_AUTH_TOKEN||'CHANGE_THIS_IN_PRODUCTION';fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace(/sseAuthToken: 'CHANGE_THIS_IN_PRODUCTION'/g,\"sseAuthToken: '\"+t+\"'\"));"

# Build the application with both locales (es and en)
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production
LABEL project="metradingplat"
LABEL service="frontend"

# Set working directory
WORKDIR /app

# Install dumb-init to handle signals properly
RUN apk add --no-cache dumb-init

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Create a non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 4200

# Set environment variables
ENV PORT=4200
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4200', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "dist/frontend/server/server.mjs"]
