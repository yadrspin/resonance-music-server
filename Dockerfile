# Multi-stage lightweight production container for Windows Docker Desktop & Linux
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig.json vite.config.ts ./
RUN npm ci

COPY index.html ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV MUSIC_DIR=/music
ENV DATA_DIR=/data

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY server ./server
COPY src/utils ./src/utils
COPY src/types ./src/types
COPY server.ts tsconfig.json ./

# Create default directories
RUN mkdir -p /music /data

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
