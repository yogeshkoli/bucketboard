# Stage 1: Build
FROM node:18-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

WORKDIR /app

COPY pnpm-lock.yaml package.json ./
RUN pnpm install

COPY . .
RUN pnpm build

# Stage 2: Serve
FROM node:18-alpine

RUN corepack enable && corepack prepare pnpm@8.15.5 --activate

WORKDIR /app

COPY --from=builder /app ./

EXPOSE 3000
ENV NODE_ENV=production

CMD ["pnpm", "start"]