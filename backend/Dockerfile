FROM node:18-bullseye-slim as builder

# Install build dependencies (FFmpeg, Python, etc.)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    build-essential \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (Use npm install to be safe if lockfile is missing)
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# --- Runtime Stage ---
FROM node:18-bullseye-slim

WORKDIR /app

# Install runtime dependencies (FFmpeg, Python)
# MediaSoup needs Python to run its worker process
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy built artifacts and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
# Create public directory for HLS segments
RUN mkdir -p public

# Environment variables (overridden by docker-compose)
ENV NODE_ENV=production
ENV PORT=3000

# Start server
CMD ["node", "dist/server.js"]
