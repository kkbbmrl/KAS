# Stage 1: Build Frontend & Backend
FROM node:22-slim AS builder

WORKDIR /app

COPY app/package*.json ./
RUN npm install

COPY app/ .
RUN npm run build

# Stage 2: Production Execution
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY app/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/server/data ./server/data

RUN mkdir -p /app/server/data/uploads

EXPOSE 5000

CMD ["node", "dist-server/index.js"]
