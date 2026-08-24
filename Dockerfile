# Stage 1: Build Frontend & Backend
FROM node:22-slim AS builder

WORKDIR /app

# Install native compilation dependencies for node-gyp (Python, make, g++)
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY app/package*.json ./
RUN npm install

COPY app/ .
RUN npm run build

# Stage 2: Production Execution
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install runtime compilation dependencies for native addons
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/server/db ./server/db

RUN mkdir -p /app/server/data/uploads

CMD ["node", "dist-server/index.js"]
